import { CardioSession, CardioActivityType, CompletedWorkout, WeightRecord } from '../types';

export interface HealthImportResult {
  cardio: CardioSession[];
  workouts: CompletedWorkout[];
  weights: WeightRecord[];
  sourceName: string;
  summary: string;
}

function parseXmlDocument(xmlContent: string) {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser().parseFromString(xmlContent, 'application/xml');
  }
  // Lightweight fallback for Node test environments
  return {
    querySelectorAll(tag: string) {
      // Find full tag including closing if present, or self-closing
      const regex = new RegExp(`<${tag}\\b([\\s\\S]*?)(?:/>|>(?:[\\s\\S]*?)</${tag}>)`, 'gi');
      const matches: any[] = [];
      let m;
      while ((m = regex.exec(xmlContent)) !== null) {
        const fullBlock = m[0];
        const attrBlock = m[1];
        matches.push({
          getAttribute(attrName: string) {
            const attrMatch = new RegExp(`${attrName}=["']([^"']*)["']`, 'i').exec(attrBlock);
            return attrMatch ? attrMatch[1] : null;
          },
          querySelector(subTag: string) {
            const subMatch = new RegExp(`<${subTag}\\b[^>]*>([\\s\\S]*?)</${subTag}>`, 'i').exec(fullBlock);
            return subMatch ? { textContent: subMatch[1].trim() } : null;
          },
          querySelectorAll(subTag: string) {
            const subRegex = new RegExp(`<${subTag}\\b([\\s\\S]*?)(?:/>|>(?:[\\s\\S]*?)</${subTag}>)`, 'gi');
            const subMatches: any[] = [];
            let sm;
            while ((sm = subRegex.exec(fullBlock)) !== null) {
              const smBlock = sm[0];
              const smAttrs = sm[1];
              subMatches.push({
                getAttribute(an: string) {
                  const am = new RegExp(`${an}=["']([^"']*)["']`, 'i').exec(smAttrs);
                  return am ? am[1] : null;
                },
                querySelector(st: string) {
                  const m = new RegExp(`<${st}\\b[^>]*>([\\s\\S]*?)</${st}>`, 'i').exec(smBlock);
                  return m ? { textContent: m[1].trim() } : null;
                },
              });
            }
            return subMatches;
          },
        });
      }
      return matches;
    },
  } as any;
}

/**
 * Parses Apple Health XML export string (or fragment)
 */
export function parseAppleHealthXml(xmlContent: string): HealthImportResult {
  const doc = parseXmlDocument(xmlContent);
  const cardio: CardioSession[] = [];
  const workouts: CompletedWorkout[] = [];
  const weights: WeightRecord[] = [];

  // Parse Workouts
  const workoutNodes = doc.querySelectorAll('Workout');
  workoutNodes.forEach((node, idx) => {
    const rawType = node.getAttribute('workoutActivityType') || '';
    const duration = parseFloat(node.getAttribute('duration') || '0');
    const durationUnit = node.getAttribute('durationUnit') || 'sec';
    const totalDistance = parseFloat(node.getAttribute('totalDistance') || '0');
    const totalDistanceUnit = node.getAttribute('totalDistanceUnit') || 'km';
    const totalEnergy = parseFloat(node.getAttribute('totalEnergyBurned') || '0');
    const creationDate = node.getAttribute('creationDate') || node.getAttribute('startDate') || new Date().toISOString();

    const durationMinutes = durationUnit === 'min' ? Math.round(duration) : Math.round(duration / 60);
    const distanceKm = totalDistanceUnit === 'm' ? totalDistance / 1000 : (totalDistanceUnit === 'mi' ? totalDistance * 1.60934 : totalDistance);

    // Detect if cardio or strength
    if (rawType.includes('Strength') || rawType.includes('WeightTraining')) {
      workouts.push({
        id: `apple-strength-${Date.now()}-${idx}`,
        name: 'Apple Health Strength Workout',
        startTime: creationDate,
        endTime: new Date(new Date(creationDate).getTime() + (durationMinutes * 60000)).toISOString(),
        durationSeconds: durationMinutes * 60,
        exercises: [],
        totalVolumeKg: 0,
        notes: `Imported from Apple Health (${Math.round(totalEnergy)} kcal)`,
      });
    } else {
      let activityType: CardioActivityType = 'running';
      let title = 'Apple Health Workout';

      if (rawType.includes('Running')) {
        activityType = 'running';
        title = 'Apple Watch Run';
      } else if (rawType.includes('Cycling')) {
        activityType = 'cycling';
        title = 'Apple Watch Outdoor Cycle';
      } else if (rawType.includes('Walking')) {
        activityType = 'walking';
        title = 'Apple Health Walk';
      } else if (rawType.includes('Swimming')) {
        activityType = 'swimming';
        title = 'Apple Watch Swim';
      } else if (rawType.includes('Rowing')) {
        activityType = 'rowing';
        title = 'Apple Watch Rowing';
      } else if (rawType.includes('Elliptical')) {
        activityType = 'elliptical';
        title = 'Apple Watch Elliptical';
      }

      let paceMinPerKm: string | undefined;
      if (distanceKm > 0 && durationMinutes > 0) {
        const paceDec = durationMinutes / distanceKm;
        const mins = Math.floor(paceDec);
        const secs = Math.round((paceDec - mins) * 60);
        paceMinPerKm = `${mins}:${secs.toString().padStart(2, '0')}`;
      }

      cardio.push({
        id: `apple-cardio-${Date.now()}-${idx}`,
        type: activityType,
        activity: activityType,
        name: title,
        date: creationDate,
        durationMinutes: Math.max(1, durationMinutes),
        distanceKm: distanceKm > 0 ? parseFloat(distanceKm.toFixed(2)) : undefined,
        caloriesBurned: Math.round(totalEnergy) || Math.round(durationMinutes * 8.5),
        avgPaceMinPerKm: paceMinPerKm,
        notes: 'Synced from Apple Health',
      });
    }
  });

  // Parse BodyMass Records (Weights)
  const weightNodes = doc.querySelectorAll('Record[type="HKQuantityTypeIdentifierBodyMass"]');
  weightNodes.forEach((node) => {
    const rawVal = parseFloat(node.getAttribute('value') || '0');
    const unit = node.getAttribute('unit') || 'kg';
    const dateStr = (node.getAttribute('startDate') || node.getAttribute('creationDate') || '').slice(0, 10);
    
    if (rawVal > 0 && dateStr) {
      const weightKg = unit === 'lbs' || unit === 'lb' ? rawVal * 0.453592 : rawVal;
      weights.push({
        date: dateStr,
        weightKg: parseFloat(weightKg.toFixed(2)),
        notes: 'Synced from Apple Health scale',
      });
    }
  });

  return {
    cardio,
    workouts,
    weights,
    sourceName: 'Apple Health',
    summary: `Found ${cardio.length} cardio sessions, ${workouts.length} strength workouts, and ${weights.length} weigh-in logs.`,
  };
}

/**
 * Parses Garmin TCX (Training Center XML)
 */
export function parseGarminTcx(tcxContent: string): HealthImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(tcxContent, 'application/xml');
  const cardio: CardioSession[] = [];

  const activityNodes = doc.querySelectorAll('Activity');
  activityNodes.forEach((act, idx) => {
    const sport = (act.getAttribute('Sport') || 'running').toLowerCase();
    const idNode = act.querySelector('Id');
    const rawDate = idNode?.textContent || new Date().toISOString();

    let totalSec = 0;
    let totalMeters = 0;
    let calories = 0;
    let hrSum = 0;
    let hrCount = 0;

    const lapNodes = act.querySelectorAll('Lap');
    lapNodes.forEach((lap) => {
      totalSec += parseFloat(lap.querySelector('TotalTimeSeconds')?.textContent || '0');
      totalMeters += parseFloat(lap.querySelector('DistanceMeters')?.textContent || '0');
      calories += parseFloat(lap.querySelector('Calories')?.textContent || '0');
      const avgHr = lap.querySelector('AverageHeartRateBpm > Value');
      if (avgHr?.textContent) {
        hrSum += parseFloat(avgHr.textContent);
        hrCount++;
      }
    });

    const durationMinutes = Math.max(1, Math.round(totalSec / 60));
    const distanceKm = totalMeters > 0 ? parseFloat((totalMeters / 1000).toFixed(2)) : undefined;

    let activityType: CardioActivityType = 'running';
    let label = 'Garmin Activity';

    if (sport.includes('bik') || sport.includes('cycl')) {
      activityType = 'cycling';
      label = 'Garmin Ride';
    } else if (sport.includes('run')) {
      activityType = 'running';
      label = 'Garmin Run';
    } else if (sport.includes('walk') || sport.includes('hik')) {
      activityType = 'walking';
      label = 'Garmin Walk';
    } else if (sport.includes('swim')) {
      activityType = 'swimming';
      label = 'Garmin Swim';
    }

    let paceMinPerKm: string | undefined;
    if (distanceKm && distanceKm > 0 && durationMinutes > 0) {
      const paceDec = durationMinutes / distanceKm;
      const mins = Math.floor(paceDec);
      const secs = Math.round((paceDec - mins) * 60);
      paceMinPerKm = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    cardio.push({
      id: `garmin-tcx-${Date.now()}-${idx}`,
      type: activityType,
      activity: activityType,
      name: label,
      date: rawDate,
      durationMinutes,
      durationSeconds: Math.round(totalSec),
      distanceKm,
      caloriesBurned: Math.round(calories) || Math.round(durationMinutes * 9),
      avgHeartRateBpm: hrCount > 0 ? Math.round(hrSum / hrCount) : undefined,
      avgPaceMinPerKm: paceMinPerKm,
      notes: 'Imported from Garmin TCX file',
    });
  });

  return {
    cardio,
    workouts: [],
    weights: [],
    sourceName: 'Garmin Connect (TCX)',
    summary: `Found ${cardio.length} Garmin activities.`,
  };
}

/**
 * Parses Garmin GPX Tracks
 */
export function parseGarminGpx(gpxContent: string): HealthImportResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxContent, 'application/xml');
  const cardio: CardioSession[] = [];

  const trkNodes = doc.querySelectorAll('trk');
  trkNodes.forEach((trk, idx) => {
    const name = trk.querySelector('name')?.textContent || 'Garmin GPX Activity';
    const trkpts = trk.querySelectorAll('trkpt');

    let totalMeters = 0;
    let startTimeMs: number | null = null;
    let endTimeMs: number | null = null;
    let prevLat: number | null = null;
    let prevLon: number | null = null;
    let totalElevation = 0;
    let prevEle: number | null = null;

    trkpts.forEach((pt) => {
      const lat = parseFloat(pt.getAttribute('lat') || '0');
      const lon = parseFloat(pt.getAttribute('lon') || '0');
      const timeStr = pt.querySelector('time')?.textContent;
      const ele = parseFloat(pt.querySelector('ele')?.textContent || '0');

      if (timeStr) {
        const timeVal = new Date(timeStr).getTime();
        if (!isNaN(timeVal)) {
          if (startTimeMs === null) startTimeMs = timeVal;
          endTimeMs = timeVal;
        }
      }

      if (prevLat !== null && prevLon !== null) {
        totalMeters += haversineMeters(prevLat, prevLon, lat, lon);
      }
      prevLat = lat;
      prevLon = lon;

      if (prevEle !== null && ele > prevEle) {
        totalElevation += (ele - prevEle);
      }
      prevEle = ele;
    });

    const durationSeconds = startTimeMs !== null && endTimeMs !== null && endTimeMs >= startTimeMs
      ? Math.max(60, Math.round((endTimeMs - startTimeMs) / 1000))
      : 1800;
    const durationMinutes = Math.round(durationSeconds / 60);
    const distanceKm = totalMeters > 0 ? parseFloat((totalMeters / 1000).toFixed(2)) : undefined;

    let activityType: CardioActivityType = 'running';
    const lowerName = name.toLowerCase();
    if (lowerName.includes('bike') || lowerName.includes('cycle') || lowerName.includes('ride')) {
      activityType = 'cycling';
    } else if (lowerName.includes('walk') || lowerName.includes('hike')) {
      activityType = 'walking';
    }

    cardio.push({
      id: `garmin-gpx-${Date.now()}-${idx}`,
      type: activityType,
      activity: activityType,
      name,
      date: new Date(startTimeMs || Date.now()).toISOString(),
      durationMinutes,
      durationSeconds,
      distanceKm,
      elevationMeters: Math.round(totalElevation),
      caloriesBurned: Math.round(durationMinutes * 8),
      notes: 'Imported from Garmin GPX Track',
    });
  });

  return {
    cardio,
    workouts: [],
    weights: [],
    sourceName: 'Garmin GPX',
    summary: `Found ${cardio.length} GPS track activities.`,
  };
}

/**
 * Parses generic CSV from Garmin Connect, Apple Health, or MyFitnessPal exports
 */
export function parseFitnessCsv(csvContent: string): HealthImportResult {
  const lines = csvContent.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { cardio: [], workouts: [], weights: [], sourceName: 'CSV', summary: 'File empty or no rows' };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const cardio: CardioSession[] = [];
  const weights: WeightRecord[] = [];

  // Identify column indices
  const dateIdx = headers.findIndex((h) => h.includes('date') || h.includes('time'));
  const activityIdx = headers.findIndex((h) => h.includes('activity') || h.includes('type') || h.includes('sport'));
  const distIdx = headers.findIndex((h) => h.includes('dist'));
  const calIdx = headers.findIndex((h) => h.includes('cal'));
  const durationIdx = headers.findIndex((h) => h.includes('duration') || h.includes('time'));
  const hrIdx = headers.findIndex((h) => h.includes('hr') || h.includes('heart'));
  const weightIdx = headers.findIndex((h) => h.includes('weight') || h.includes('mass'));

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/['"]/g, ''));
    if (cols.length < 2) continue;

    const rawDate = dateIdx !== -1 ? cols[dateIdx] : new Date().toISOString();
    const parsedDate = new Date(rawDate);
    const isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();

    // Check if weight row
    if (weightIdx !== -1 && cols[weightIdx]) {
      const wVal = parseFloat(cols[weightIdx]);
      if (wVal > 30 && wVal < 300) {
        weights.push({
          date: isoDate.slice(0, 10),
          weightKg: wVal,
          notes: 'Imported from CSV',
        });
        continue;
      }
    }

    // Cardio row
    const rawType = activityIdx !== -1 ? cols[activityIdx].toLowerCase() : 'running';
    let actType: CardioActivityType = 'running';
    if (rawType.includes('bike') || rawType.includes('cycl')) actType = 'cycling';
    else if (rawType.includes('walk')) actType = 'walking';
    else if (rawType.includes('swim')) actType = 'swimming';

    const rawDist = distIdx !== -1 ? parseFloat(cols[distIdx]) : 0;
    const rawCals = calIdx !== -1 ? parseFloat(cols[calIdx]) : 0;
    const rawDur = durationIdx !== -1 ? parseDurationToMinutes(cols[durationIdx]) : 30;
    const rawHr = hrIdx !== -1 ? parseFloat(cols[hrIdx]) : undefined;

    cardio.push({
      id: `csv-act-${Date.now()}-${i}`,
      type: actType,
      activity: actType,
      name: cols[activityIdx] || 'Cardio Activity',
      date: isoDate,
      durationMinutes: Math.max(1, rawDur),
      distanceKm: rawDist > 0 ? parseFloat(rawDist.toFixed(2)) : undefined,
      caloriesBurned: Math.round(rawCals) || Math.round(rawDur * 8),
      avgHeartRateBpm: rawHr && !isNaN(rawHr) ? Math.round(rawHr) : undefined,
      notes: 'Imported from CSV file',
    });
  }

  return {
    cardio,
    workouts: [],
    weights,
    sourceName: 'Activity CSV',
    summary: `Found ${cardio.length} activities and ${weights.length} weights.`,
  };
}

/**
 * Universal dispatcher for dropped/selected files
 */
export async function parseHealthFile(file: File): Promise<HealthImportResult> {
  const text = await file.text();
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.tcx')) {
    return parseGarminTcx(text);
  }
  if (lowerName.endsWith('.gpx')) {
    return parseGarminGpx(text);
  }
  if (lowerName.endsWith('.xml')) {
    // Check if Apple Health or Garmin
    if (text.includes('HKWorkoutActivityType') || text.includes('HealthData')) {
      return parseAppleHealthXml(text);
    }
    if (text.includes('TrainingCenterDatabase')) {
      return parseGarminTcx(text);
    }
    return parseAppleHealthXml(text);
  }
  if (lowerName.endsWith('.csv')) {
    return parseFitnessCsv(text);
  }
  if (lowerName.endsWith('.json')) {
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return parseJsonPayload(data);
      }
      if (data.cardio || data.workouts || data.weights) {
        return {
          cardio: data.cardio || [],
          workouts: data.workouts || [],
          weights: data.weights || [],
          sourceName: data.source || 'JSON Import',
          summary: `Loaded ${data.cardio?.length || 0} cardio, ${data.workouts?.length || 0} workouts.`,
        };
      }
    } catch {
      throw new Error('Invalid JSON format');
    }
  }

  // Fallback try XML or CSV
  if (text.trim().startsWith('<')) {
    return parseAppleHealthXml(text);
  }
  return parseFitnessCsv(text);
}

/**
 * Handle iOS Shortcut URL query parameter: ?health_sync=...
 */
export function checkUrlForHealthSync(): HealthImportResult | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const syncData = url.searchParams.get('health_sync');
    if (!syncData) return null;

    // Decode base64 or URI component
    let jsonStr = '';
    try {
      jsonStr = atob(syncData);
    } catch {
      jsonStr = decodeURIComponent(syncData);
    }

    const payload = JSON.parse(jsonStr);
    const result = Array.isArray(payload) ? parseJsonPayload(payload) : {
      cardio: payload.cardio || [],
      workouts: payload.workouts || [],
      weights: payload.weights || [],
      sourceName: 'iOS Health Shortcut',
      summary: 'Auto-synced via iOS Health Shortcut',
    };

    // Clean URL without reload
    url.searchParams.delete('health_sync');
    window.history.replaceState({}, document.title, url.toString());

    return result;
  } catch (err) {
    console.error('Error reading health_sync param:', err);
    return null;
  }
}

/**
 * Parse an array of JSON objects (e.g. from iOS Shortcut or AutoExport)
 */
export function parseJsonPayload(items: any[]): HealthImportResult {
  const cardio: CardioSession[] = [];
  const workouts: CompletedWorkout[] = [];
  const weights: WeightRecord[] = [];

  items.forEach((item, idx) => {
    const rawType = (item.type || item.activity || '').toLowerCase();
    const date = item.date || item.startDate || new Date().toISOString();

    if (rawType === 'weight' || item.weightKg || item.bodyMass) {
      weights.push({
        date: date.slice(0, 10),
        weightKg: parseFloat(item.weightKg || item.bodyMass || item.value),
        notes: 'Synced via iOS Shortcut',
      });
      return;
    }

    if (rawType.includes('strength') || rawType.includes('workout')) {
      workouts.push({
        id: `shortcut-strength-${Date.now()}-${idx}`,
        name: item.name || 'Strength Workout',
        startTime: date,
        endTime: new Date(new Date(date).getTime() + (item.durationMinutes || 45) * 60000).toISOString(),
        durationSeconds: (item.durationMinutes || 45) * 60,
        exercises: [],
        totalVolumeKg: item.volumeKg || 0,
        notes: 'Synced from Apple Health',
      });
    } else {
      let act: CardioActivityType = 'running';
      if (rawType.includes('bike') || rawType.includes('cycling')) act = 'cycling';
      else if (rawType.includes('walk')) act = 'walking';
      else if (rawType.includes('swim')) act = 'swimming';

      cardio.push({
        id: `shortcut-cardio-${Date.now()}-${idx}`,
        type: act,
        activity: act,
        name: item.name || `Synced ${act.charAt(0).toUpperCase() + act.slice(1)}`,
        date,
        durationMinutes: item.durationMinutes || Math.round((item.durationSeconds || 1800) / 60),
        distanceKm: item.distanceKm,
        caloriesBurned: item.caloriesBurned || item.calories || 250,
        avgHeartRateBpm: item.avgHeartRateBpm || item.heartRate,
        avgPaceMinPerKm: item.avgPaceMinPerKm,
        notes: 'Synced from Apple Watch / Garmin',
      });
    }
  });

  return {
    cardio,
    workouts,
    weights,
    sourceName: 'iOS Health Shortcut',
    summary: `Imported ${cardio.length} cardio, ${workouts.length} workouts, and ${weights.length} weights.`,
  };
}

/**
 * Pre-configured wearable sample packs for instantaneous demo & testing
 */
export function getSampleWearableActivities(type: 'apple_watch' | 'garmin_forerunner'): HealthImportResult {
  const now = new Date();
  const todayStr = now.toISOString();
  const yesterday = new Date(now.getTime() - 86400000).toISOString();

  if (type === 'apple_watch') {
    return {
      sourceName: 'Apple Watch Series 9',
      summary: '1 outdoor morning run & 1 body composition weigh-in',
      cardio: [
        {
          id: `apple-sample-${Date.now()}`,
          type: 'running',
          activity: 'running',
          name: 'Apple Watch Outdoor Run',
          date: todayStr,
          durationMinutes: 28,
          durationSeconds: 1680,
          distanceKm: 5.24,
          avgPaceMinPerKm: '5:21',
          caloriesBurned: 388,
          avgHeartRateBpm: 156,
          elevationMeters: 45,
          notes: 'Apple Health • Pace 5:21/km • HR 156 bpm',
        },
      ],
      workouts: [],
      weights: [
        {
          date: todayStr.slice(0, 10),
          weightKg: 78.9,
          notes: 'Withings Body+ Smart Scale via Apple Health',
        },
      ],
    };
  }

  // Garmin Forerunner sample
  return {
    sourceName: 'Garmin Forerunner 965',
    summary: '1 coastal tempo ride with elevation & cadence',
    cardio: [
      {
        id: `garmin-sample-${Date.now()}`,
        type: 'cycling',
        activity: 'cycling',
        name: 'Garmin Connect Coastal Ride',
        date: yesterday,
        durationMinutes: 64,
        durationSeconds: 3840,
        distanceKm: 31.8,
        avgPaceMinPerKm: '2:01',
        caloriesBurned: 742,
        avgHeartRateBpm: 144,
        elevationMeters: 280,
        notes: 'Garmin TCX • Avg Speed 29.8 km/h • 280m climbing',
      },
    ],
    workouts: [
      {
        id: `garmin-strength-${Date.now()}`,
        name: 'Garmin Strength Session',
        startTime: new Date(now.getTime() - 172800000).toISOString(),
        endTime: new Date(now.getTime() - 170100000).toISOString(),
        durationSeconds: 2700,
        exercises: [],
        totalVolumeKg: 3450,
        notes: 'Logged on Garmin watch (45m, 290 kcal)',
      },
    ],
    weights: [],
  };
}

// Haversine formula helper for GPX coordinate distance in meters
function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseDurationToMinutes(val: string): number {
  if (!val) return 30;
  if (!isNaN(Number(val))) return Math.round(Number(val));
  // Parse "01:24:30" or "45:10"
  const parts = val.split(':').map((p) => parseFloat(p) || 0);
  if (parts.length === 3) {
    return Math.round(parts[0] * 60 + parts[1] + parts[2] / 60);
  }
  if (parts.length === 2) {
    return Math.round(parts[0] + parts[1] / 60);
  }
  return 30;
}
