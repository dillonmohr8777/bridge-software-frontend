import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenePath = process.argv[2];
if (!scenePath) {
  throw new Error("Usage: node scripts/compose-og.mjs <scene-image>");
}

const markSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="224" viewBox="0 0 180 112">
  <g fill="none" stroke="#F4EFFF" stroke-width="13" stroke-linecap="round">
    <path d="M23 105V78a67 67 0 0 1 134 0v27"/>
    <path d="M45 105V78a45 45 0 0 1 90 0v27"/>
    <path d="M67 105V78a23 23 0 0 1 46 0v27"/>
  </g>
</svg>`;

const width = 1200;
const height = 630;
const mark = await sharp(Buffer.from(markSvg)).png().toBuffer();
const markMeta = await sharp(mark).metadata();
const markWidth = 168;
const markHeight = Math.round((markMeta.height / markMeta.width) * markWidth);

const scene = sharp(scenePath).resize(width, height, { fit: "cover", position: "centre" });
const scrim = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#0A0610" stop-opacity="0.88"/>
        <stop offset="42%" stop-color="#0A0610" stop-opacity="0.55"/>
        <stop offset="72%" stop-color="#0A0610" stop-opacity="0.12"/>
        <stop offset="100%" stop-color="#0A0610" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
  </svg>`,
);

const titleSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280">
    <text x="0" y="92" fill="#F4EFFF" font-family="Segoe UI, Arial, sans-serif" font-size="92" font-weight="800" letter-spacing="4">BRIDGE</text>
    <text x="2" y="148" fill="#C4B5FD" font-family="Segoe UI, Arial, sans-serif" font-size="28" font-weight="600">The cannabis industry, connected</text>
    <text x="2" y="196" fill="#A78BFA" font-family="Segoe UI, Arial, sans-serif" font-size="22" font-weight="500">Secondary review preview</text>
  </svg>`,
);

const composed = await scene
  .composite([
    { input: scrim, top: 0, left: 0 },
    { input: await sharp(mark).resize(markWidth, markHeight).png().toBuffer(), top: 118, left: 64 },
    { input: titleSvg, top: 250, left: 56 },
  ])
  .png()
  .toBuffer();

const ogPath = path.join(root, "public", "og.png");
const faviconPath = path.join(root, "public", "favicon.ico");
await writeFile(ogPath, composed);
await sharp(mark).resize(32, 32, { fit: "contain", background: { r: 10, g: 6, b: 16, alpha: 1 } }).png().toFile(faviconPath);
const ogInfo = await sharp(composed).metadata();
console.log(JSON.stringify({ og: path.relative(root, ogPath), width: ogInfo.width, height: ogInfo.height, bytes: composed.length, favicon: "public/favicon.ico" }));
