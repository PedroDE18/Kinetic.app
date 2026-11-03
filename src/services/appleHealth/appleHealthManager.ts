import {
  ImportProgressUpdate,
  NormalizedHealthImportData,
} from './types';
import { AppleHealthDataAggregator } from './appleHealthAggregator';
import { StreamingAppleHealthXmlParser } from './streamingXmlParser';
import { streamAppleHealthZip, streamXmlFile } from './zipStreamReader';

/**
 * Universal Apple Health ingestion manager.
 * Uses Web Worker when available in the browser; falls back cleanly to direct streaming in Node / tests.
 */
export async function parseAppleHealthFile(
  file: File,
  onProgress?: (update: ImportProgressUpdate) => void,
  abortSignal?: AbortSignal
): Promise<NormalizedHealthImportData> {
  // If running in browser with Web Worker support, use the background worker
  if (typeof Worker !== 'undefined' && typeof window !== 'undefined') {
    return runInWorker(file, onProgress, abortSignal);
  }

  // Fallback direct streaming (for Node testing or worker-restricted contexts)
  return runDirectStreaming(file, onProgress, abortSignal);
}

function runInWorker(
  file: File,
  onProgress?: (update: ImportProgressUpdate) => void,
  abortSignal?: AbortSignal
): Promise<NormalizedHealthImportData> {
  return new Promise((resolve, reject) => {
    let worker: Worker | null = null;

    try {
      worker = new Worker(new URL('./appleHealthWorker.ts', import.meta.url), {
        type: 'module',
      });
    } catch (e) {
      // If Worker creation fails (e.g. CSP or blob restriction), fallback to direct
      console.warn('Worker instantiation failed, falling back to direct stream:', e);
      runDirectStreaming(file, onProgress, abortSignal).then(resolve).catch(reject);
      return;
    }

    const cleanup = () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        if (worker) {
          worker.postMessage({ type: 'CANCEL' });
          cleanup();
          reject(new Error('Import aborted by user'));
        }
      });
    }

    worker.onmessage = (e: MessageEvent) => {
      const { type, payload, error } = e.data || {};
      if (type === 'PROGRESS' && onProgress) {
        onProgress(payload);
      } else if (type === 'SUCCESS') {
        cleanup();
        resolve(payload);
      } else if (type === 'ERROR') {
        cleanup();
        reject(new Error(error || 'Failed parsing Apple Health export'));
      } else if (type === 'ABORTED') {
        cleanup();
        reject(new Error('Import aborted by user'));
      }
    };

    worker.onerror = (err) => {
      cleanup();
      reject(new Error(err.message || 'Worker thread execution failed'));
    };

    worker.postMessage({ type: 'START_IMPORT', file });
  });
}

/**
 * Direct streaming execution for Node.js test suites or when Web Workers are unavailable.
 */
export async function runDirectStreaming(
  file: File,
  onProgress?: (update: ImportProgressUpdate) => void,
  abortSignal?: AbortSignal
): Promise<NormalizedHealthImportData> {
  const aggregator = new AppleHealthDataAggregator();
  let recordsCount = 0;

  const parser = new StreamingAppleHealthXmlParser(
    {
      onRecord: (record) => {
        recordsCount++;
        aggregator.handleRecord(record);
        if (recordsCount % 1000 === 0 && onProgress) {
          onProgress({
            stage: 'parsing',
            progressPct: Math.min(90, Math.round((recordsCount / 50000) * 100)),
            recordsParsed: recordsCount,
          });
        }
      },
      onWorkout: (workout) => {
        recordsCount++;
        aggregator.handleWorkout(workout);
      },
      onActivitySummary: (summary) => {
        recordsCount++;
        aggregator.handleActivitySummary(summary);
      },
      onProgress: (bytesRead, totalBytes) => {
        if (totalBytes > 0 && onProgress) {
          const pct = Math.round((bytesRead / totalBytes) * 90);
          onProgress({ stage: 'parsing', progressPct: pct, recordsParsed: recordsCount });
        }
      },
    },
    {
      abortSignal,
      estimatedTotalBytes: file.size,
    }
  );

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.zip')) {
    if (onProgress) onProgress({ stage: 'unzipping', progressPct: 10, recordsParsed: 0 });
    await streamAppleHealthZip(
      file,
      (xmlChunk, chunkSize) => parser.pushChunk(xmlChunk, chunkSize),
      abortSignal
    );
  } else {
    if (onProgress) onProgress({ stage: 'reading', progressPct: 5, recordsParsed: 0 });
    await streamXmlFile(
      file,
      (xmlChunk, bytesRead) => parser.pushChunk(xmlChunk, bytesRead),
      abortSignal
    );
  }

  parser.finish();
  if (onProgress) onProgress({ stage: 'normalizing', progressPct: 98, recordsParsed: recordsCount });

  return aggregator.finalize();
}

/**
 * Synchronous direct string parser for unit tests and small test XML fragments.
 */
export function parseAppleHealthXmlString(xmlContent: string): NormalizedHealthImportData {
  const aggregator = new AppleHealthDataAggregator();
  const parser = new StreamingAppleHealthXmlParser({
    onRecord: (r) => aggregator.handleRecord(r),
    onWorkout: (w) => aggregator.handleWorkout(w),
    onActivitySummary: (s) => aggregator.handleActivitySummary(s),
  });

  parser.pushChunk(xmlContent, xmlContent.length);
  parser.finish();
  return aggregator.finalize();
}
