import fs from 'node:fs';
import zlib from 'node:zlib';

// Minimal standard PNG creator using pure Node zlib
function createPng(width, height, renderPixel) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines.writeUInt8(0, offset++); // Filter byte: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      scanlines.writeUInt8(r, offset++);
      scanlines.writeUInt8(g, offset++);
      scanlines.writeUInt8(b, offset++);
      scanlines.writeUInt8(a, offset++);
    }
  }

  const compressedData = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(4 + 4 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  
  // Calculate CRC32 for type + data
  const crcTarget = chunk.subarray(4, 8 + length);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Simple CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Render warm cozy icon: rounded squircle warm background (#FAF7F2 / #C85A32 terracotta K lettermark)
function drawKineticIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const rCorner = w * 0.22;
  
  // Rounded squircle check
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  const maxD = w * 0.46;
  
  // Background squircle
  const isOutsideCorner = (dx > maxD - rCorner) && (dy > maxD - rCorner);
  let inBounds = true;
  if (isOutsideCorner) {
    const cdx = dx - (maxD - rCorner);
    const cdy = dy - (maxD - rCorner);
    if (cdx * cdx + cdy * cdy > rCorner * rCorner) {
      inBounds = false;
    }
  } else if (dx > maxD || dy > maxD) {
    inBounds = false;
  }

  if (!inBounds) return [0, 0, 0, 0]; // Transparent outside

  // Cozy terracotta warm badge:
  // Base background: #2A231E (cozy espresso) with warm terracotta center (#C85A32)
  const distFromCenter = Math.sqrt(Math.pow((x - cx) / w, 2) + Math.pow((y - cy) / h, 2));
  
  // Draw Letter K
  // Stem: x from 0.32*w to 0.4*w, y from 0.28*h to 0.72*h
  const inStem = (x >= w * 0.30 && x <= w * 0.40 && y >= h * 0.26 && y <= h * 0.74);
  
  // Top arm of K
  // Line from (0.38*w, 0.52*h) to (0.70*w, 0.28*h)
  const d1 = distToSegment(x, y, w * 0.38, h * 0.52, w * 0.70, h * 0.28);
  const inArm1 = d1 <= (w * 0.055);

  // Bottom arm of K
  // Line from (0.45*w, 0.46*h) to (0.70*w, 0.72*h)
  const d2 = distToSegment(x, y, w * 0.44, h * 0.47, w * 0.70, h * 0.72);
  const inArm2 = d2 <= (w * 0.055);

  if (inStem || inArm1 || inArm2) {
    // Warm terracotta / peach glow on the K
    return [200, 90, 50, 255]; // #C85A32 warm terracotta
  }

  // Warm cozy subtle gradient background
  // Warm dark espresso: rgb(40, 34, 29) to rgb(24, 20, 18)
  const bgR = Math.round(38 - distFromCenter * 15);
  const bgG = Math.round(32 - distFromCenter * 15);
  const bgB = Math.round(28 - distFromCenter * 15);
  return [bgR, bgG, bgB, 255];
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

// Generate files
const sizes = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

for (const s of sizes) {
  const buf = createPng(s.size, s.size, drawKineticIcon);
  fs.writeFileSync(`./public/${s.name}`, buf);
  console.log(`Generated ./public/${s.name} (${buf.length} bytes)`);
}
