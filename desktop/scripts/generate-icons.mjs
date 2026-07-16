#!/usr/bin/env node
/**
 * @project AncestorTree Desktop
 * @file desktop/scripts/generate-icons.mjs
 * @description Generate placeholder app icons for all platforms.
 *              Produces: build/icon.png (1024x1024), build/icon.icns (macOS),
 *              build/icon.ico (Windows).
 *              No external dependencies — uses pure Node.js zlib + macOS sips/iconutil.
 * @version 1.0.0
 * @updated 2026-02-26
 */

import { execSync } from 'child_process';
import zlib from 'zlib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, '..', 'build');

// ─── PNG Generator ───────────────────────────────────────────────────────────

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) | 0;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

function generatePNG(size, getPixel) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3); // filter=0 + RGB
    for (let x = 0; x < size; x++) {
      const [r, g, b] = getPixel(x, y, size);
      row[1 + x * 3] = r; row[1 + x * 3 + 1] = g; row[1 + x * 3 + 2] = b;
    }
    rows.push(row);
  }
  const compressed = zlib.deflateSync(Buffer.concat(rows), { level: 6 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // bit depth=8, color=RGB
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  return Buffer.concat([sig, pngChunk('IHDR', ihdr), pngChunk('IDAT', compressed), pngChunk('IEND', Buffer.alloc(0))]);
}

// ─── Icon Design ─────────────────────────────────────────────────────────────
// AncestorTree logo: dark forest background + white tree silhouette + gold star

function getPixel(x, y, S) {
  const cx = S / 2, cy = S / 2;
  const dx = x - cx, dy = y - cy;

  // Rounded background (circle)
  if (dx * dx + dy * dy > (S * 0.48) ** 2) return [0x10, 0x24, 0x18]; // outside: dark

  // Background gradient: dark forest green
  const dist = Math.sqrt(dx * dx + dy * dy) / (S * 0.48);
  const bg = [Math.round(0x1A + dist * 0x0E), Math.round(0x3D + dist * 0x1A), Math.round(0x25 + dist * 0x10)];

  // Tree trunk: centered rect, lower half
  const trW = S * 0.07, trTop = S * 0.58, trBot = S * 0.76;
  if (Math.abs(dx) <= trW / 2 && y >= trTop && y <= trBot) return [0xA0, 0x6C, 0x43];

  // Tree layer 3 (bottom, widest): y = 0.53..0.72
  const t3t = S * 0.53, t3b = S * 0.72, t3w = S * 0.40;
  if (y >= t3t && y <= t3b) {
    if (Math.abs(dx) <= (t3w / 2) * ((y - t3t) / (t3b - t3t))) return [0x1F, 0x7A, 0x28];
  }
  // Tree layer 2 (middle): y = 0.37..0.58
  const t2t = S * 0.37, t2b = S * 0.58, t2w = S * 0.32;
  if (y >= t2t && y <= t2b) {
    if (Math.abs(dx) <= (t2w / 2) * ((y - t2t) / (t2b - t2t))) return [0x28, 0x9B, 0x32];
  }
  // Tree layer 1 (top, narrowest): y = 0.22..0.43
  const t1t = S * 0.22, t1b = S * 0.43, t1w = S * 0.22;
  if (y >= t1t && y <= t1b) {
    if (Math.abs(dx) <= (t1w / 2) * ((y - t1t) / (t1b - t1t))) return [0x36, 0xBB, 0x40];
  }
  // Gold star at top
  if (dx * dx + (y - S * 0.18) ** 2 <= (S * 0.05) ** 2) return [0xFF, 0xD7, 0x00];

  return bg;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

// 1. Generate 1024x1024 PNG
const pngPath = path.join(buildDir, 'icon.png');
fs.writeFileSync(pngPath, generatePNG(1024, getPixel));
console.log(`✓ icon.png (1024x1024)`);

// 2. macOS .icns using sips + iconutil
if (process.platform === 'darwin') {
  try {
    const iconset = path.join(buildDir, 'icon.iconset');
    if (!fs.existsSync(iconset)) fs.mkdirSync(iconset);

    for (const [name, size] of [
      ['icon_16x16.png', 16], ['icon_16x16@2x.png', 32],
      ['icon_32x32.png', 32], ['icon_32x32@2x.png', 64],
      ['icon_64x64.png', 64], ['icon_64x64@2x.png', 128],
      ['icon_128x128.png', 128], ['icon_128x128@2x.png', 256],
      ['icon_256x256.png', 256], ['icon_256x256@2x.png', 512],
      ['icon_512x512.png', 512], ['icon_512x512@2x.png', 1024],
    ]) {
      execSync(`sips -z ${size} ${size} "${pngPath}" --out "${path.join(iconset, name)}" > /dev/null 2>&1`);
    }
    const icnsPath = path.join(buildDir, 'icon.icns');
    execSync(`iconutil -c icns "${iconset}" -o "${icnsPath}"`);
    fs.rmSync(iconset, { recursive: true }); // clean up .iconset
    console.log(`✓ icon.icns (macOS)`);
  } catch (e) {
    console.warn(`⚠ Could not generate .icns: ${e.message}`);
  }
}

// 3. Windows .ico — proper ICO format with embedded PNG images
const icoSizes = [16, 32, 48, 64, 128, 256];
const pngImages = icoSizes.map(s => generatePNG(s, getPixel));

// ICO header: reserved(2) + type=1(2) + count(2)
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);     // type = icon
header.writeUInt16LE(icoSizes.length, 4);

// Directory entries (16 bytes each), then image data
const dirSize = icoSizes.length * 16;
let dataOffset = 6 + dirSize;
const dirEntries = [];
for (let i = 0; i < icoSizes.length; i++) {
  const entry = Buffer.alloc(16);
  entry[0] = icoSizes[i] >= 256 ? 0 : icoSizes[i]; // width (0 = 256)
  entry[1] = icoSizes[i] >= 256 ? 0 : icoSizes[i]; // height
  entry[2] = 0;  // color palette
  entry[3] = 0;  // reserved
  entry.writeUInt16LE(1, 4);  // color planes
  entry.writeUInt16LE(24, 6); // bits per pixel
  entry.writeUInt32LE(pngImages[i].length, 8);
  entry.writeUInt32LE(dataOffset, 12);
  dataOffset += pngImages[i].length;
  dirEntries.push(entry);
}

const icoPath = path.join(buildDir, 'icon.ico');
fs.writeFileSync(icoPath, Buffer.concat([header, ...dirEntries, ...pngImages]));
console.log(`✓ icon.ico (${icoSizes.join(', ')}px, proper ICO format)`);

console.log('\n✅ Icons ready in desktop/build/');
