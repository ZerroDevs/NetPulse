const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // PNG format construction
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // ColorType RGBA
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // IDAT
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type None
    buffer.copy(rawData, rowOffset + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Standard CRC32 table
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  return crcTable;
}

function crc32(buf) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Painter function for NetPulse icon
function drawNetPulse(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Background: Solid dark slate (#0b0f19)
  let r = 11, g = 15, b = 25, a = 255;

  // Outer border (#1f2937)
  if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
    return [31, 41, 55, 255];
  }

  const cx = 0.5;
  const cy = 0.65;
  const dx = nx - cx;
  const dy = ny - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Outer pulse: Indigo (#6366f1)
  if (ny < cy && Math.abs(dist - 0.38) < 0.035) {
    return [99, 102, 241, 255];
  }

  // Mid pulse: Blue (#3b82f6)
  if (ny < cy && Math.abs(dist - 0.25) < 0.035) {
    return [59, 130, 246, 255];
  }

  // Inner pulse: Emerald (#10b981)
  if (ny < cy && Math.abs(dist - 0.13) < 0.035) {
    return [16, 185, 129, 255];
  }

  // Antenna Center Top Node (#10b981)
  if (dist < 0.055) {
    return [16, 185, 129, 255];
  }

  // Mast vertical line (#f3f4f6)
  if (Math.abs(nx - cx) < 0.03 && ny >= cy && ny <= 0.88) {
    return [243, 244, 246, 255];
  }

  // Crossbar (#f3f4f6)
  if (ny >= 0.75 && ny <= 0.78 && Math.abs(nx - cx) < 0.12) {
    return [243, 244, 246, 255];
  }

  // Base (#f3f4f6)
  if (ny >= 0.86 && ny <= 0.89 && Math.abs(nx - cx) < 0.2) {
    return [243, 244, 246, 255];
  }

  return [r, g, b, a];
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const png = createPNG(size, size, drawNetPulse);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), png);
  console.log(`Generated icon${size}.png (${png.length} bytes)`);
});
