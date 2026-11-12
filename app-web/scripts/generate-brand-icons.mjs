// Run from app-web: node scripts/generate-brand-icons.mjs
// Uses the authored PixelReceipt matrix in task-frame.tsx, without raster dependencies.
import { readFile, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const component = await readFile(new URL("../components/task-frame.tsx", import.meta.url), "utf8");
const source = component.match(/const receiptCells = \[([\s\S]*?)\];/)?.[1];
const rows = [...(source ?? "").matchAll(/"([01]+)"/g)].map((match) => match[1]);
if (rows.length !== 11 || rows.some((row) => row.length !== 10)) throw new Error("PixelReceipt matrix changed; review icon geometry.");
const paper = [233, 225, 205];
const blue = [46, 96, 189];
const output = new URL("../public/", import.meta.url);

function cells(size, maskable = false) {
  const step = size === 16 ? 1 : Math.floor(size * (maskable ? 0.045 : 0.0625));
  const gap = size === 16 ? 0 : Math.max(1, Math.round(step / 4));
  const cell = step - gap;
  const left = Math.floor((size - (10 * step - gap)) / 2);
  const top = Math.floor((size - (11 * step - gap)) / 2);
  return rows.flatMap((row, y) => [...row].flatMap((value, x) => value === "1" ? [{
    x: left + x * step, y: top + y * step, size: cell, opacity: x === 0 || y === 0 ? 0.55 : 1,
  }] : []));
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}
function png(size, maskable = false) {
  const pixels = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      blue.forEach((value, channel) => { pixels[y * (1 + size * 3) + 1 + x * 3 + channel] = value; });
    }
  }
  for (const cell of cells(size, maskable)) {
    for (let y = cell.y; y < cell.y + cell.size; y++) {
      for (let x = cell.x; x < cell.x + cell.size; x++) {
        paper.forEach((value, channel) => {
          pixels[y * (1 + size * 3) + 1 + x * 3 + channel] = Math.round(value * cell.opacity + blue[channel] * (1 - cell.opacity));
        });
      }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(pixels)), chunk("IEND", Buffer.alloc(0))]);
}

const rects = cells(64).map((cell) => `<rect x="${cell.x}" y="${cell.y}" width="${cell.size}" height="${cell.size}"${cell.opacity < 1 ? ` opacity="${cell.opacity}"` : ""}/>`).join("");
await writeFile(new URL("favicon.svg", output), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="crispEdges"><rect width="64" height="64" fill="#2e60bd"/><g fill="#e9e1cd">${rects}</g></svg>\n`);
for (const [name, size, maskable] of [
  ["favicon-16x16.png", 16], ["favicon-32x32.png", 32], ["apple-touch-icon.png", 180],
  ["app-icon-192.png", 192], ["app-icon-512.png", 512], ["app-icon-maskable-512.png", 512, true],
]) await writeFile(new URL(name, output), png(size, maskable));

const sizes = [16, 32, 48];
const images = sizes.map((size) => png(size));
const directory = Buffer.alloc(6 + 16 * images.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(images.length, 4);
let offset = directory.length;
images.forEach((image, index) => {
  const entry = 6 + index * 16;
  directory[entry] = directory[entry + 1] = sizes[index];
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(24, entry + 6);
  directory.writeUInt32LE(image.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});
await writeFile(new URL("favicon.ico", output), Buffer.concat([directory, ...images]));
console.log("Generated pixel receipt SVG, PNG, Apple, maskable and ICO branding assets.");
