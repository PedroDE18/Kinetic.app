import {
  AppleHealthRawRecord,
  AppleHealthWorkoutRecord,
  AppleHealthActivitySummaryRecord,
} from './types';
import { normalizeDistanceToKm, normalizeEnergyToKcal, parseAppleHealthDate } from './normalization';

export interface StreamingXmlParserCallbacks {
  onRecord?: (record: AppleHealthRawRecord) => void;
  onWorkout?: (workout: AppleHealthWorkoutRecord) => void;
  onActivitySummary?: (summary: AppleHealthActivitySummaryRecord) => void;
  onProgress?: (bytesProcessed: number, estimatedTotalBytes: number) => void;
}

export interface StreamingXmlParserOptions {
  abortSignal?: AbortSignal;
  estimatedTotalBytes?: number;
}

/**
 * High-performance streaming XML parser for Apple Health exports.
 * Parses chunks incrementally without constructing an in-memory DOM tree.
 * Memory footprint is strictly bounded to the active buffer chunk size (~64KB - 256KB).
 */
export class StreamingAppleHealthXmlParser {
  private buffer: string = '';
  private bytesProcessed: number = 0;
  private estimatedTotalBytes: number = 0;
  private callbacks: StreamingXmlParserCallbacks;
  private abortSignal?: AbortSignal;

  constructor(callbacks: StreamingXmlParserCallbacks, options?: StreamingXmlParserOptions) {
    this.callbacks = callbacks;
    this.abortSignal = options?.abortSignal;
    this.estimatedTotalBytes = options?.estimatedTotalBytes || 0;
  }

  /**
   * Ingests a raw string chunk into the streaming parser.
   */
  public pushChunk(chunk: string, chunkSizeInBytes: number = chunk.length): void {
    if (this.abortSignal?.aborted) {
      throw new Error('Import aborted by user');
    }

    this.buffer += chunk;
    this.bytesProcessed += chunkSizeInBytes;
    this.processBuffer();

    if (this.callbacks.onProgress) {
      this.callbacks.onProgress(this.bytesProcessed, this.estimatedTotalBytes);
    }
  }

  /**
   * Finalizes parsing of any remaining buffer data.
   */
  public finish(): void {
    if (this.abortSignal?.aborted) {
      throw new Error('Import aborted by user');
    }
    this.processBuffer(true);
    this.buffer = '';
  }

  private processBuffer(isFinal: boolean = false): void {
    let cursor = 0;
    const len = this.buffer.length;

    while (cursor < len) {
      if (this.abortSignal?.aborted) {
        throw new Error('Import aborted by user');
      }

      // Look for the next opening tag among the supported top-level entities
      const nextRecord = this.buffer.indexOf('<Record', cursor);
      const nextWorkout = this.buffer.indexOf('<Workout', cursor);
      const nextActivity = this.buffer.indexOf('<ActivitySummary', cursor);

      // Find the earliest matching tag
      const candidates = [
        { type: 'Record', index: nextRecord },
        { type: 'Workout', index: nextWorkout },
        { type: 'ActivitySummary', index: nextActivity },
      ].filter((c) => c.index !== -1);

      if (candidates.length === 0) {
        // No more supported tags found in current buffer
        break;
      }

      candidates.sort((a, b) => a.index - b.index);
      const earliest = candidates[0];
      const tagStart = earliest.index;

      if (earliest.type === 'Record') {
        const parsed = this.parseRecordTag(tagStart);
        if (parsed === null) {
          // Incomplete tag fragment across chunk boundary; wait for more chunks unless isFinal
          break;
        }
        cursor = parsed.nextCursor;
      } else if (earliest.type === 'Workout') {
        const parsed = this.parseWorkoutTag(tagStart);
        if (parsed === null) {
          break;
        }
        cursor = parsed.nextCursor;
      } else if (earliest.type === 'ActivitySummary') {
        const parsed = this.parseActivitySummaryTag(tagStart);
        if (parsed === null) {
          break;
        }
        cursor = parsed.nextCursor;
      }
    }

    // Keep only the unparsed tail in buffer
    if (cursor > 0) {
      this.buffer = this.buffer.slice(cursor);
    } else if (isFinal) {
      this.buffer = '';
    }
  }

  private parseRecordTag(startIndex: number): { nextCursor: number } | null {
    // Check if self-closing: <Record ... />
    // Or closed tag: <Record ...> ... </Record>
    const firstClose = this.buffer.indexOf('>', startIndex);
    if (firstClose === -1) return null;

    const isSelfClosing = this.buffer[firstClose - 1] === '/';
    let fullBlock = '';
    let nextCursor = 0;

    if (isSelfClosing) {
      fullBlock = this.buffer.slice(startIndex, firstClose + 1);
      nextCursor = firstClose + 1;
    } else {
      const closingTag = '</Record>';
      const closeEnd = this.buffer.indexOf(closingTag, firstClose);
      if (closeEnd === -1) return null; // Wait for complete tag
      fullBlock = this.buffer.slice(startIndex, closeEnd + closingTag.length);
      nextCursor = closeEnd + closingTag.length;
    }

    if (this.callbacks.onRecord) {
      const attrs = parseXmlAttributes(fullBlock);
      if (attrs.type && (attrs.value !== undefined || attrs.startDate)) {
        let metadata: Record<string, string> | undefined;

        if (!isSelfClosing && fullBlock.includes('<MetadataEntry')) {
          metadata = extractMetadataEntries(fullBlock);
        }

        const rawRecord: AppleHealthRawRecord = {
          type: attrs.type,
          value: attrs.value || '0',
          unit: attrs.unit,
          startDate: attrs.startDate || attrs.creationDate || new Date().toISOString(),
          endDate: attrs.endDate || attrs.startDate || attrs.creationDate || new Date().toISOString(),
          creationDate: attrs.creationDate,
          sourceName: attrs.sourceName,
          sourceVersion: attrs.sourceVersion,
          device: attrs.device,
          metadata,
        };

        this.callbacks.onRecord(rawRecord);
      }
    }

    return { nextCursor };
  }

  private parseWorkoutTag(startIndex: number): { nextCursor: number } | null {
    const firstClose = this.buffer.indexOf('>', startIndex);
    if (firstClose === -1) return null;

    const isSelfClosing = this.buffer[firstClose - 1] === '/';
    let fullBlock = '';
    let nextCursor = 0;

    if (isSelfClosing) {
      fullBlock = this.buffer.slice(startIndex, firstClose + 1);
      nextCursor = firstClose + 1;
    } else {
      const closingTag = '</Workout>';
      const closeEnd = this.buffer.indexOf(closingTag, firstClose);
      if (closeEnd === -1) return null;
      fullBlock = this.buffer.slice(startIndex, closeEnd + closingTag.length);
      nextCursor = closeEnd + closingTag.length;
    }

    if (this.callbacks.onWorkout) {
      const attrs = parseXmlAttributes(fullBlock);
      const activityType = attrs.workoutActivityType || 'HKWorkoutActivityTypeOther';

      // Duration parsing (durationUnit: 'min' or 'sec')
      const rawDur = parseFloat(attrs.duration || '0');
      const durUnit = (attrs.durationUnit || 'sec').toLowerCase();
      const durationSeconds = durUnit === 'min' ? Math.round(rawDur * 60) : Math.round(rawDur);

      // Distance parsing
      const rawDist = parseFloat(attrs.totalDistance || '0');
      const distUnit = attrs.totalDistanceUnit || 'km';
      const distanceKm = rawDist > 0 ? normalizeDistanceToKm(rawDist, distUnit) : undefined;

      // Energy parsing
      const rawEnergy = parseFloat(attrs.totalEnergyBurned || '0');
      const energyUnit = attrs.totalEnergyBurnedUnit || 'kcal';
      const energyKcal = rawEnergy > 0 ? normalizeEnergyToKcal(rawEnergy, energyUnit) : undefined;

      // Heart rate statistics from <WorkoutStatistics>
      let avgHeartRateBpm: number | undefined;
      let maxHeartRateBpm: number | undefined;

      if (!isSelfClosing && fullBlock.includes('<WorkoutStatistics')) {
        const stats = extractWorkoutStatistics(fullBlock);
        avgHeartRateBpm = stats.avgHeartRateBpm;
        maxHeartRateBpm = stats.maxHeartRateBpm;
      }

      const workoutRecord: AppleHealthWorkoutRecord = {
        activityType,
        durationSeconds,
        distanceKm,
        energyKcal,
        startDate: attrs.startDate || attrs.creationDate || new Date().toISOString(),
        endDate: attrs.endDate || attrs.startDate || new Date().toISOString(),
        creationDate: attrs.creationDate,
        sourceName: attrs.sourceName,
        sourceVersion: attrs.sourceVersion,
        device: attrs.device,
        avgHeartRateBpm,
        maxHeartRateBpm,
      };

      this.callbacks.onWorkout(workoutRecord);
    }

    return { nextCursor };
  }

  private parseActivitySummaryTag(startIndex: number): { nextCursor: number } | null {
    const firstClose = this.buffer.indexOf('>', startIndex);
    if (firstClose === -1) return null;

    const fullBlock = this.buffer.slice(startIndex, firstClose + 1);
    const nextCursor = firstClose + 1;

    if (this.callbacks.onActivitySummary) {
      const attrs = parseXmlAttributes(fullBlock);
      const dateComponents = attrs.dateComponents || attrs.date;

      if (dateComponents) {
        const date = dateComponents.slice(0, 10);
        const rawActiveEnergy = parseFloat(attrs.activeEnergyBurned || '0');
        const activeUnit = attrs.activeEnergyBurnedUnit || 'kcal';
        const activeKcal = normalizeEnergyToKcal(rawActiveEnergy, activeUnit);

        const summary: AppleHealthActivitySummaryRecord = {
          date,
          activeEnergyBurnedKcal: activeKcal,
          activeEnergyGoalKcal: parseFloat(attrs.activeEnergyBurnedGoal || '0'),
          exerciseTimeMinutes: parseFloat(attrs.appleExerciseTime || '0'),
          exerciseTimeGoalMinutes: parseFloat(attrs.appleExerciseTimeGoal || '0'),
          standHours: parseFloat(attrs.appleStandHours || '0'),
          standHoursGoal: parseFloat(attrs.appleStandHoursGoal || '0'),
        };

        this.callbacks.onActivitySummary(summary);
      }
    }

    return { nextCursor };
  }
}

/**
 * Extracts attribute key-value pairs from an XML tag string without DOMParser.
 */
export function parseXmlAttributes(tagString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  // Extract up to the first closing '>'
  const end = tagString.indexOf('>');
  const header = end !== -1 ? tagString.slice(0, end) : tagString;

  const regex = /([a-zA-Z0-9_:-]+)=["']([^"']*)["']/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(header)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

/**
 * Extracts metadata entries from an element block: <MetadataEntry key="..." value="..."/>
 */
function extractMetadataEntries(xmlBlock: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const metaRegex = /<(?:Workout)?MetadataEntry\b([^>]*?)\/?>/gi;
  let m: RegExpExecArray | null;

  while ((m = metaRegex.exec(xmlBlock)) !== null) {
    const a = parseXmlAttributes(m[0]);
    if (a.key && a.value !== undefined) {
      meta[a.key] = a.value;
    }
  }

  return meta;
}

/**
 * Extracts heart rate statistics from <WorkoutStatistics type="HKQuantityTypeIdentifierHeartRate" .../>
 */
function extractWorkoutStatistics(xmlBlock: string): { avgHeartRateBpm?: number; maxHeartRateBpm?: number } {
  const statsRegex = /<WorkoutStatistics\b([^>]*?)\/?>/gi;
  let m: RegExpExecArray | null;
  let avgHeartRateBpm: number | undefined;
  let maxHeartRateBpm: number | undefined;

  while ((m = statsRegex.exec(xmlBlock)) !== null) {
    const a = parseXmlAttributes(m[0]);
    if (a.type && a.type.includes('HeartRate')) {
      if (a.average) avgHeartRateBpm = Math.round(parseFloat(a.average));
      if (a.maximum) maxHeartRateBpm = Math.round(parseFloat(a.maximum));
    }
  }

  return { avgHeartRateBpm, maxHeartRateBpm };
}
