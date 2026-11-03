import fs from 'node:fs';
import zlib from 'node:zlib';

// Minimal standard PNG creator using pure Node zlib
function createPng(width, height, renderPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const ihdrChunk = createChunk('IHDR', ihdr);

  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    scanlines.writeUInt8(0, offset++);
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
  
  const crcTarget = chunk.subarray(4, 8 + length);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

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

// Render refined Stoic Eunoia icon: rounded squircle dark basalt stone with Greek Epsilon emblem
function drawEunoiaIcon(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const rCorner = w * 0.24;
  
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);
  const maxD = w * 0.46;
  
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

  if (!inBounds) return [0, 0, 0, 0];

  const strokeW = w * 0.08;
  const xLeft = w * 0.36;
  const xRightTop = w * 0.68;
  const xRightMid = w * 0.60;
  const xRightBot = w * 0.68;
  const yTop = h * 0.28;
  const yMid = h * 0.50;
  const yBot = h * 0.72;

  // Dist to vertical spine
  const dSpine = distToSegment(x, y, xLeft, yTop, xLeft, yBot);
  // Dist to top arm
  const dTop = distToSegment(x, y, xLeft, yTop, xRightTop, yTop);
  // Dist to mid arm
  const dMid = distToSegment(x, y, xLeft, yMid, xRightMid, yMid);
  // Dist to bot arm
  const dBot = distToSegment(x, y, xLeft, yBot, xRightBot, yBot);

  const minDist = Math.min(dSpine, dTop, dMid, dBot);

  if (minDist <= strokeW / 2) {
    // Serene Stoic sage green
    return [158, 185, 158, 255];
  }

  // Dark basalt stone background: #181B18 to #121412
  const distFromCenter = Math.hypot((x - cx) / w, (y - cy) / h);
  const bgR = Math.max(16, Math.round(25 - distFromCenter * 14));
  const bgG = Math.max(18, Math.round(28 - distFromCenter * 14));
  const bgB = Math.max(16, Math.round(25 - distFromCenter * 14));
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

const sizes = [
  { size: 180, name: 'apple-touch-icon.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

for (const s of sizes) {
  const buf = createPng(s.size, s.size, drawEunoiaIcon);
  fs.writeFileSync(`./public/${s.name}`, buf);
  console.log(`Generated ./public/${s.name} (${buf.length} bytes)`);
}
