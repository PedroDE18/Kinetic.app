import { AppleHealthDataAggregator } from './appleHealthAggregator';
import { StreamingAppleHealthXmlParser } from './streamingXmlParser';
import { streamAppleHealthZip, streamXmlFile } from './zipStreamReader';
import { ImportProgressUpdate, NormalizedHealthImportData } from './types';

let currentAbortController: AbortController | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, file } = e.data || {};

  if (type === 'CANCEL') {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    return;
  }

  if (type === 'START_IMPORT') {
    if (!(file instanceof File)) {
      self.postMessage({ type: 'ERROR', error: 'Invalid file provided to worker' });
      return;
    }

    currentAbortController = new AbortController();
    const abortSignal = currentAbortController.signal;
    const aggregator = new AppleHealthDataAggregator();

    let lastProgressPostTime = 0;
    let recordsCount = 0;

    const reportProgress = (
      stage: ImportProgressUpdate['stage'],
      progressPct: number,
      force: boolean = false
    ) => {
      const now = performance.now();
      if (force || now - lastProgressPostTime > 80) {
        lastProgressPostTime = now;
        const msg: ImportProgressUpdate = {
          stage,
          progressPct: Math.min(100, Math.max(0, Math.round(progressPct))),
          recordsParsed: recordsCount,
        };
        self.postMessage({ type: 'PROGRESS', payload: msg });
      }
    };

    const parser = new StreamingAppleHealthXmlParser(
      {
        onRecord: (record) => {
          recordsCount++;
          aggregator.handleRecord(record);
          if (recordsCount % 500 === 0) {
            reportProgress('parsing', Math.min(95, (recordsCount / 50000) * 100));
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
          if (totalBytes > 0) {
            const pct = (bytesRead / totalBytes) * 90;
            reportProgress('parsing', pct);
          }
        },
      },
      {
        abortSignal,
        estimatedTotalBytes: file.size,
      }
    );

    try {
      const lowerName = file.name.toLowerCase();
      reportProgress(lowerName.endsWith('.zip') ? 'unzipping' : 'reading', 5, true);

      if (lowerName.endsWith('.zip')) {
        await streamAppleHealthZip(
          file,
          (xmlChunk, chunkSize) => {
            parser.pushChunk(xmlChunk, chunkSize);
          },
          abortSignal
        );
      } else {
        await streamXmlFile(
          file,
          (xmlChunk, bytesRead) => {
            parser.pushChunk(xmlChunk, bytesRead);
          },
          abortSignal
        );
      }

      parser.finish();
      reportProgress('normalizing', 98, true);

      const normalized: NormalizedHealthImportData = aggregator.finalize();
      self.postMessage({ type: 'SUCCESS', payload: normalized });
    } catch (err: any) {
      if (abortSignal.aborted) {
        self.postMessage({ type: 'ABORTED' });
      } else {
        self.postMessage({ type: 'ERROR', error: err?.message || 'Failed to parse Apple Health export' });
      }
    } finally {
      currentAbortController = null;
    }
  }
};
