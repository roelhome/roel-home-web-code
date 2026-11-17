import sharp from 'sharp';
import fs from 'fs';

// 1. Load roel-favicon.jpeg
const input = sharp('roel-favicon.jpeg');
const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });

// Convert to RGBA transparent buffer
const rgbaFull = Buffer.alloc(info.width * info.height * 4);

for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const srcIdx = (y * info.width + x) * 3;
    const dstIdx = (y * info.width + x) * 4;
    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Smooth transparency: pure white (>248) is 0 alpha, pure black (<10) is 255 alpha
    let alpha = 0;
    if (lum < 248) {
      alpha = Math.min(255, Math.max(0, Math.round((248 - lum) / 248 * 255)));
    }

    rgbaFull[dstIdx] = 25;      // #19120C Deep Charcoal
    rgbaFull[dstIdx + 1] = 18;
    rgbaFull[dstIdx + 2] = 12;
    rgbaFull[dstIdx + 3] = alpha;
  }
}

const fullTransparent = sharp(rgbaFull, {
  raw: { width: info.width, height: info.height, channels: 4 }
});

// Save exact transparent roel-favicon.png in root and public/
await fullTransparent.clone().png().toFile('roel-favicon.png');
await fullTransparent.clone().png().toFile('public/roel-favicon.png');
console.log('Saved roel-favicon.png in root and public/');

// 2. Prepare square favicon master (512x512)
// Trim long horizontal tails slightly to maximize visibility and balance in square tab
const trimmedBuf = await fullTransparent.clone()
  .extract({ left: 100, top: 25, width: 630, height: 260 })
  .png()
  .toBuffer();

const masterBuffer = await sharp(trimmedBuf)
  .resize(512, 512, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 }
  })
  .png()
  .toBuffer();

await sharp(masterBuffer).toFile('public/favicon-512x512.png');

// 3. Generate high-res Apple Touch Icon (180x180)
const p180 = await sharp(masterBuffer)
  .resize(180, 180, { kernel: 'lanczos3' })
  .png()
  .toBuffer();
fs.writeFileSync('public/apple-touch-icon.png', p180);

// 4. Generate 48x48, 32x32, 16x16 with crisp stroke contrast
const p48 = await sharp(masterBuffer)
  .sharpen({ sigma: 1.2, m1: 1.2, m2: 2 })
  .resize(48, 48, { kernel: 'lanczos3' })
  .png()
  .toBuffer();

const p32 = await sharp(masterBuffer)
  .sharpen({ sigma: 1.5, m1: 1.5, m2: 2 })
  .resize(32, 32, { kernel: 'lanczos3' })
  .sharpen({ sigma: 0.5, m1: 1, m2: 2 })
  .png()
  .toBuffer();

const p16 = await sharp(masterBuffer)
  .sharpen({ sigma: 2.0, m1: 2.0, m2: 2.5 })
  .resize(16, 16, { kernel: 'lanczos3' })
  .sharpen({ sigma: 0.6, m1: 1.2, m2: 2 })
  .png()
  .toBuffer();

fs.writeFileSync('public/favicon-48x48.png', p48);
fs.writeFileSync('public/favicon-32x32.png', p32);
fs.writeFileSync('public/favicon-16x16.png', p16);
fs.writeFileSync('public/favicon.png', p32); // Fallback /favicon.png
console.log('Saved favicon raster sizes (16, 32, 48, 180)');

// 5. Generate standard multi-res favicon.ico
function createIco(buffers) {
  const numImages = buffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + numImages * entrySize;

  let offset = dirSize;
  const entries = [];
  for (const buf of buffers) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    const size = buf.length;

    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(size, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += size;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(numImages, 4);

  return Buffer.concat([header, ...entries, ...buffers]);
}

const icoBuffer = createIco([p16, p32, p48]);
fs.writeFileSync('public/favicon.ico', icoBuffer);
console.log('Saved public/favicon.ico');

// 6. Generate adaptive favicon.svg (with prefers-color-scheme light/dark support)
const base64Master = masterBuffer.toString('base64');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <style>
    :root {
      color-scheme: light dark;
    }
    .brand-mark {
      filter: none;
    }
    @media (prefers-color-scheme: dark) {
      .brand-mark {
        filter: invert(1) brightness(1.2);
      }
    }
  </style>
  <image class="brand-mark" width="512" height="512" href="data:image/png;base64,${base64Master}" />
</svg>`;

fs.writeFileSync('public/favicon.svg', svg);
console.log('Saved public/favicon.svg');
