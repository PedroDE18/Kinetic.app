import { Unzip, UnzipFile } from 'fflate';

/**
 * Streams and decompresses an Apple Health export.zip archive on-the-fly.
 * Extracts export.xml chunk-by-chunk without loading the entire archive into memory.
 */
export async function streamAppleHealthZip(
  file: File,
  onXmlChunk: (chunk: string, uncompressedBytes: number) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder('utf-8', { fatal: false });

  return new Promise<void>((resolve, reject) => {
    let targetFound = false;
    let completed = false;

    const unzipper = new Unzip((unzipFile: UnzipFile) => {
      const name = unzipFile.name.toLowerCase();
      // Look for export.xml or apple_health_export/export.xml (ignore export_cda.xml)
      if (name.endsWith('export.xml') && !name.includes('cda')) {
        targetFound = true;
        unzipFile.ondata = (err, chunk, final) => {
          if (err) {
            reject(err);
            return;
          }
          if (abortSignal?.aborted) {
            reject(new Error('Import aborted by user'));
            return;
          }
          if (chunk && chunk.length > 0) {
            const textChunk = decoder.decode(chunk, { stream: !final });
            onXmlChunk(textChunk, chunk.length);
          }
          if (final) {
            completed = true;
            resolve();
          }
        };
        unzipFile.start();
      }
    });

    const stream = file.stream();
    const reader = stream.getReader();

    function readNext() {
      if (abortSignal?.aborted) {
        reader.cancel().catch(() => {});
        reject(new Error('Import aborted by user'));
        return;
      }

      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            try {
              unzipper.push(new Uint8Array(0), true);
            } catch (e) {
              // ignore trailing push
            }
            if (!targetFound && !completed) {
              reject(
                new Error(
                  'No export.xml found inside the ZIP archive. Ensure this is an authentic Apple Health export bundle.'
                )
              );
            }
            return;
          }
          if (value) {
            unzipper.push(value, false);
          }
          readNext();
        })
        .catch(reject);
    }

    readNext();
  });
}

/**
 * Streams a direct .xml file chunk-by-chunk using the Web Streams API.
 */
export async function streamXmlFile(
  file: File,
  onXmlChunk: (chunk: string, bytesRead: number) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const stream = file.stream();
  const reader = stream.getReader();

  while (true) {
    if (abortSignal?.aborted) {
      await reader.cancel();
      throw new Error('Import aborted by user');
    }

    const { done, value } = await reader.read();
    if (done) break;

    if (value && value.length > 0) {
      const textChunk = decoder.decode(value, { stream: true });
      onXmlChunk(textChunk, value.length);
    }
  }

  // Flush any trailing byte from decoder
  const finalTail = decoder.decode();
  if (finalTail) {
    onXmlChunk(finalTail, 0);
  }
}
