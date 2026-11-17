// Generates the PWA icons in public/icons/ without any image library.
// Run: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

const BG = [37, 99, 235]; // blue-600
const BOARD = [255, 255, 255];
const THICK = [30, 64, 175]; // blue-800
const THIN = [191, 219, 254]; // blue-200
const FILL = [219, 234, 254]; // blue-100
const ACCENT = [37, 99, 235];

/** Colour of the icon at normalized coords (u, v) in [0,1]. `inset` = board margin. */
function shade(u, v, inset, rounded) {
  // Outer rounded corners (transparent) for the non-maskable "any" icon.
  if (rounded) {
    const r = 0.22;
    const cx = Math.min(Math.max(u, r), 1 - r);
    const cy = Math.min(Math.max(v, r), 1 - r);
    if ((u - cx) ** 2 + (v - cy) ** 2 > r * r) return null;
  }
  const a = inset, b = 1 - inset;
  if (u < a || u > b || v < a || v > b) return BG;
  const x = (u - a) / (b - a), y = (v - a) / (b - a);
  // Board corner rounding.
  const br = 0.08;
  const bx = Math.min(Math.max(x, br), 1 - br), by = Math.min(Math.max(y, br), 1 - br);
  if ((x - bx) ** 2 + (y - by) ** 2 > br * br) return BG;

  const pad = 0.06;
  if (x < pad || x > 1 - pad || y < pad || y > 1 - pad) return BOARD;
  const gx = (x - pad) / (1 - 2 * pad), gy = (y - pad) / (1 - 2 * pad);
  const col = Math.min(8, Math.floor(gx * 9)), row = Math.min(8, Math.floor(gy * 9));

  const near = (g, step, w) => {
    const k = Math.round(g * step) / step;
    return Math.abs(g - k) < w;
  };
  if (near(gx, 3, 0.022) || near(gy, 3, 0.022)) return THICK;
  if (near(gx, 9, 0.008) || near(gy, 9, 0.008)) return THIN;

  // A few highlighted cells: a completed-row look plus a selected cell.
  if (row === 4) return FILL;
  if (row === 1 && col === 6) return ACCENT;
  if (row === 7 && col === 2) return ACCENT;
  return BOARD;
}

function render(size, { inset, rounded }) {
  const SS = 4; // supersampling for anti-aliasing
  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = shade((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, inset, rounded);
          if (!c) continue;
          r += c[0]; g += c[1]; b += c[2]; a += 255;
        }
      }
      const n = SS * SS, o = (y * size + x) * 4, cov = a / 255;
      px[o] = cov ? Math.round(r / cov) : 0;
      px[o + 1] = cov ? Math.round(g / cov) : 0;
      px[o + 2] = cov ? Math.round(b / cov) : 0;
      px[o + 3] = Math.round(a / n);
    }
  }
  return encodePng(size, size, px);
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const files = {
  "icon-192.png": render(192, { inset: 0.16, rounded: true }),
  "icon-512.png": render(512, { inset: 0.16, rounded: true }),
  // Maskable: full-bleed background, board inside the 80% safe zone.
  "maskable-192.png": render(192, { inset: 0.22, rounded: false }),
  "maskable-512.png": render(512, { inset: 0.22, rounded: false }),
  // iOS ignores transparency and rounds the corners itself.
  "apple-touch-icon.png": render(180, { inset: 0.16, rounded: false }),
};
for (const [name, buf] of Object.entries(files)) {
  writeFileSync(join(OUT, name), buf);
  console.log(`wrote public/icons/${name} (${buf.length} bytes)`);
}
