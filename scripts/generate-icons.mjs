import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

// Chrome Web Store can fail to install an extension if referenced icons are
// not decodable or are the wrong dimensions. Generate real 16/48/128 PNGs
// deterministically (no external deps) before `vite build`.
//
// Prefer generating from `public/icons/devtool_icon.png` if present (it matches
// the branding), falling back to a deterministic generated icon if decoding
// fails for any reason.

function crc32(buf) {
  // Standard CRC-32 (IEEE 802.3)
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = u32be(data.length);
  const crc = u32be(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePngRgba({ width, height, rgba }) {
  // PNG signature
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Each scanline starts with filter type 0 (None)
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const compressed = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", compressed),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function unfilterScanline(filterType, cur, prev, bpp) {
  // cur/prev include only the scanline bytes (no filter byte).
  switch (filterType) {
    case 0: // None
      return;
    case 1: // Sub
      for (let i = 0; i < cur.length; i++) {
        const left = i >= bpp ? cur[i - bpp] : 0;
        cur[i] = (cur[i] + left) & 0xff;
      }
      return;
    case 2: // Up
      for (let i = 0; i < cur.length; i++) {
        const up = prev ? prev[i] : 0;
        cur[i] = (cur[i] + up) & 0xff;
      }
      return;
    case 3: // Average
      for (let i = 0; i < cur.length; i++) {
        const left = i >= bpp ? cur[i - bpp] : 0;
        const up = prev ? prev[i] : 0;
        cur[i] = (cur[i] + (((left + up) / 2) | 0)) & 0xff;
      }
      return;
    case 4: // Paeth
      for (let i = 0; i < cur.length; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0;
        const b = prev ? prev[i] : 0;
        const c = prev && i >= bpp ? prev[i - bpp] : 0;
        cur[i] = (cur[i] + paethPredictor(a, b, c)) & 0xff;
      }
      return;
    default:
      throw new Error(`unsupported PNG filter type: ${filterType}`);
  }
}

function decodePngToRgba(pngBuf) {
  // Minimal PNG decoder: supports 8-bit, non-interlaced RGB/RGBA/Gray/Gray+Alpha.
  // Enough for our `devtool_icon.png` and common icon sources.
  if (pngBuf.length < 8) throw new Error("invalid PNG (too small)");
  const sig = pngBuf.subarray(0, 8);
  const expectedSig = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
  ]);
  if (!sig.equals(expectedSig)) throw new Error("invalid PNG signature");

  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let seenIhdr = false;
  const idatParts = [];

  while (off + 8 <= pngBuf.length) {
    const len = pngBuf.readUInt32BE(off);
    const type = pngBuf.subarray(off + 4, off + 8).toString("ascii");
    off += 8;
    if (off + len + 4 > pngBuf.length) throw new Error("truncated PNG chunk");
    const data = pngBuf.subarray(off, off + len);
    off += len;
    // const crc = pngBuf.readUInt32BE(off);
    off += 4;

    if (type === "IHDR") {
      if (len !== 13) throw new Error("invalid IHDR length");
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      const compression = data[10];
      const filter = data[11];
      interlace = data[12];
      if (compression !== 0) throw new Error("unsupported PNG compression");
      if (filter !== 0) throw new Error("unsupported PNG filter method");
      if (interlace !== 0) throw new Error("unsupported interlaced PNG");
      if (bitDepth !== 8) throw new Error(`unsupported bit depth: ${bitDepth}`);
      if (![0, 2, 4, 6].includes(colorType)) {
        throw new Error(`unsupported color type: ${colorType}`);
      }
      seenIhdr = true;
      continue;
    }

    if (type === "IDAT") {
      idatParts.push(data);
      continue;
    }

    if (type === "IEND") break;
  }

  if (!seenIhdr) throw new Error("missing IHDR");
  if (!width || !height) throw new Error("invalid image dimensions");
  if (!idatParts.length) throw new Error("missing IDAT");

  const bpp =
    colorType === 0
      ? 1
      : colorType === 2
        ? 3
        : colorType === 4
          ? 2
          : 4; // colorType 6

  const stride = width * bpp;
  const inflated = inflateSync(Buffer.concat(idatParts));
  const expected = (stride + 1) * height;
  if (inflated.length !== expected) {
    throw new Error(
      `unexpected inflated size: got ${inflated.length}, expected ${expected}`
    );
  }

  const rgba = Buffer.alloc(width * height * 4);
  let prevLine = null;

  for (let y = 0; y < height; y++) {
    const rowOff = y * (stride + 1);
    const filterType = inflated[rowOff];
    const curLine = Buffer.from(inflated.subarray(rowOff + 1, rowOff + 1 + stride));
    unfilterScanline(filterType, curLine, prevLine, bpp);

    for (let x = 0; x < width; x++) {
      const si = x * bpp;
      const di = (y * width + x) * 4;
      if (colorType === 0) {
        const g = curLine[si];
        rgba[di] = g;
        rgba[di + 1] = g;
        rgba[di + 2] = g;
        rgba[di + 3] = 255;
      } else if (colorType === 2) {
        rgba[di] = curLine[si];
        rgba[di + 1] = curLine[si + 1];
        rgba[di + 2] = curLine[si + 2];
        rgba[di + 3] = 255;
      } else if (colorType === 4) {
        const g = curLine[si];
        rgba[di] = g;
        rgba[di + 1] = g;
        rgba[di + 2] = g;
        rgba[di + 3] = curLine[si + 1];
      } else {
        rgba[di] = curLine[si];
        rgba[di + 1] = curLine[si + 1];
        rgba[di + 2] = curLine[si + 2];
        rgba[di + 3] = curLine[si + 3];
      }
    }

    prevLine = curLine;
  }

  return { width, height, rgba };
}

function resizeRgbaBox({ srcRgba, srcW, srcH, dstW, dstH }) {
  // Box filter (area resampling). Good quality for downscaling icons.
  const dst = Buffer.alloc(dstW * dstH * 4);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;
  const invArea = 1 / (scaleX * scaleY);

  for (let dy = 0; dy < dstH; dy++) {
    const y0 = dy * scaleY;
    const y1 = (dy + 1) * scaleY;
    const sy0 = Math.floor(y0);
    const sy1 = Math.ceil(y1);

    for (let dx = 0; dx < dstW; dx++) {
      const x0 = dx * scaleX;
      const x1 = (dx + 1) * scaleX;
      const sx0 = Math.floor(x0);
      const sx1 = Math.ceil(x1);

      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (let sy = sy0; sy < sy1; sy++) {
        if (sy < 0 || sy >= srcH) continue;
        const wy = Math.min(y1, sy + 1) - Math.max(y0, sy);
        if (wy <= 0) continue;
        for (let sx = sx0; sx < sx1; sx++) {
          if (sx < 0 || sx >= srcW) continue;
          const wx = Math.min(x1, sx + 1) - Math.max(x0, sx);
          if (wx <= 0) continue;
          const w = wx * wy;
          const si = (sy * srcW + sx) * 4;
          r += srcRgba[si] * w;
          g += srcRgba[si + 1] * w;
          b += srcRgba[si + 2] * w;
          a += srcRgba[si + 3] * w;
        }
      }

      const di = (dy * dstW + dx) * 4;
      dst[di] = Math.max(0, Math.min(255, Math.round(r * invArea)));
      dst[di + 1] = Math.max(0, Math.min(255, Math.round(g * invArea)));
      dst[di + 2] = Math.max(0, Math.min(255, Math.round(b * invArea)));
      dst[di + 3] = Math.max(0, Math.min(255, Math.round(a * invArea)));
    }
  }

  return dst;
}

function clampInt(v, lo, hi) {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v | 0;
}

function blendPixel(rgba, width, x, y, r, g, b, a) {
  // Background is always opaque, so we keep dst alpha at 255.
  const idx = (y * width + x) * 4;
  const inv = 255 - a;
  rgba[idx] = ((r * a + rgba[idx] * inv) / 255) | 0;
  rgba[idx + 1] = ((g * a + rgba[idx + 1] * inv) / 255) | 0;
  rgba[idx + 2] = ((b * a + rgba[idx + 2] * inv) / 255) | 0;
  rgba[idx + 3] = 255;
}

function fillRect(rgba, width, height, x0, y0, x1, y1, r, g, b, a) {
  const xx0 = clampInt(x0, 0, width);
  const yy0 = clampInt(y0, 0, height);
  const xx1 = clampInt(x1, 0, width);
  const yy1 = clampInt(y1, 0, height);
  if (xx1 <= xx0 || yy1 <= yy0) return;

  if (a === 255) {
    for (let y = yy0; y < yy1; y++) {
      for (let x = xx0; x < xx1; x++) {
        const idx = (y * width + x) * 4;
        rgba[idx] = r;
        rgba[idx + 1] = g;
        rgba[idx + 2] = b;
        rgba[idx + 3] = 255;
      }
    }
    return;
  }

  for (let y = yy0; y < yy1; y++) {
    for (let x = xx0; x < xx1; x++) {
      blendPixel(rgba, width, x, y, r, g, b, a);
    }
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function createIconPng(size) {
  const width = size;
  const height = size;
  const rgba = Buffer.alloc(width * height * 4);

  // Background gradient: #0B1220 -> #1F2937
  const c0 = { r: 0x0b, g: 0x12, b: 0x20 };
  const c1 = { r: 0x1f, g: 0x29, b: 0x37 };
  const denom = Math.max(1, (width - 1) + (height - 1));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = (x + y) / denom;
      const r = lerp(c0.r, c1.r, t) | 0;
      const g = lerp(c0.g, c1.g, t) | 0;
      const b = lerp(c0.b, c1.b, t) | 0;
      const idx = (y * width + x) * 4;
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = 255;
    }
  }

  // Soft top highlight to keep the icon from looking flat at small sizes.
  const highlightH = Math.max(1, Math.round(size * 0.28));
  fillRect(rgba, width, height, 0, 0, width, highlightH, 255, 255, 255, 18);

  // Three "tool" bars in the middle (simple, survives downscaling).
  const marginY = Math.max(2, Math.round(size * 0.18));
  const barH = size - marginY * 2;
  const barW = Math.max(2, Math.round(size * 0.12));
  const gap = Math.max(1, Math.round(barW * 0.6));
  const totalW = barW * 3 + gap * 2;
  const xStart = Math.floor((size - totalW) / 2);
  const y0 = marginY;
  const y1 = marginY + barH;

  const bars = [
    { r: 245, g: 158, b: 11 }, // amber
    { r: 20, g: 184, b: 166 }, // teal
    { r: 226, g: 232, b: 240 } // slate-200
  ];

  // Shadow first
  for (let i = 0; i < 3; i++) {
    const x0 = xStart + i * (barW + gap) + 1;
    const x1 = x0 + barW;
    fillRect(rgba, width, height, x0, y0 + 1, x1, y1 + 1, 0, 0, 0, 90);
  }
  // Bars
  for (let i = 0; i < 3; i++) {
    const x0 = xStart + i * (barW + gap);
    const x1 = x0 + barW;
    const c = bars[i];
    fillRect(rgba, width, height, x0, y0, x1, y1, c.r, c.g, c.b, 255);
  }

  // Subtle border for medium+ sizes (improves legibility on light Chrome UI).
  if (size >= 48) {
    fillRect(rgba, width, height, 0, 0, width, 1, 255, 255, 255, 32);
    fillRect(rgba, width, height, 0, height - 1, width, height, 0, 0, 0, 70);
    fillRect(rgba, width, height, 0, 0, 1, height, 255, 255, 255, 24);
    fillRect(rgba, width, height, width - 1, 0, width, height, 0, 0, 0, 70);
  }

  return encodePngRgba({ width, height, rgba });
}

async function createIconPngFromDevtoolIcon(size) {
  const srcPath = resolve(process.cwd(), "public/icons/devtool_icon.png");
  const pngBuf = await readFile(srcPath);
  const decoded = decodePngToRgba(pngBuf);
  const resized = resizeRgbaBox({
    srcRgba: decoded.rgba,
    srcW: decoded.width,
    srcH: decoded.height,
    dstW: size,
    dstH: size
  });
  return encodePngRgba({ width: size, height: size, rgba: resized });
}

async function main() {
  const iconsDir = resolve(process.cwd(), "public/icons");
  await mkdir(iconsDir, { recursive: true });

  let icon16;
  let icon48;
  let icon128;
  try {
    icon16 = await createIconPngFromDevtoolIcon(16);
    icon48 = await createIconPngFromDevtoolIcon(48);
    icon128 = await createIconPngFromDevtoolIcon(128);
  } catch (err) {
    // Keep the build working even if the source icon isn't present/decodable.
    console.warn(
      "[generate-icons] failed to use public/icons/devtool_icon.png, falling back:",
      err?.message ?? err
    );
    icon16 = createIconPng(16);
    icon48 = createIconPng(48);
    icon128 = createIconPng(128);
  }

  await Promise.all([
    writeFile(resolve(iconsDir, "icon16.png"), icon16),
    writeFile(resolve(iconsDir, "icon48.png"), icon48),
    writeFile(resolve(iconsDir, "icon128.png"), icon128)
  ]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
