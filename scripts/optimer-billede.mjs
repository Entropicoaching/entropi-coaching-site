#!/usr/bin/env node
// Optimerer ét billede: flytter originalen (uændret) til
// assets/originaler/<samme relative sti>, skalerer ned til højst den
// angivne bredde (kun hvis billedet rent faktisk er bredere — aldrig
// opskalering), og skriver en optimeret udgave tilbage på den oprindelige
// sti (samme format som kildens rigtige format — sharp afgør formatet ud
// fra billeddata, ikke filendelsen, så en .PNG-fil der reelt er et JPEG
// forbliver et JPEG), plus en .webp-søskendefil ved siden af.
//
//   node scripts/optimer-billede.mjs <fil> <maks-bredde-px>
//
// Eksempel: node scripts/optimer-billede.mjs assets/foo.jpg 800

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..');

const [, , fileArg, maxWidthArg] = process.argv;
if (!fileArg || !maxWidthArg) {
  console.error('Brug: node scripts/optimer-billede.mjs <fil> <maks-bredde-px>');
  process.exit(1);
}
const maxWidth = Number(maxWidthArg);
const filePath = path.isAbsolute(fileArg) ? fileArg : path.join(repoRoot, fileArg);
const relPath = path.relative(repoRoot, filePath);

async function main() {
  const originalBytes = readFileSync(filePath);
  const meta = await sharp(originalBytes).metadata();
  const kbBefore = Math.round(originalBytes.length / 1024);

  // Gem originalen uændret, kun hvis den ikke allerede er gemt (så et
  // genkørt script ikke ved et uheld gemmer en allerede optimeret udgave
  // som "original").
  const originalerPath = path.join(repoRoot, 'assets', 'originaler', relPath);
  if (!existsSync(originalerPath)) {
    mkdirSync(path.dirname(originalerPath), { recursive: true });
    writeFileSync(originalerPath, originalBytes);
  }

  const targetWidth = meta.width > maxWidth ? maxWidth : meta.width;
  let pipeline = sharp(originalBytes);
  if (targetWidth < meta.width) {
    pipeline = pipeline.resize({ width: targetWidth, withoutEnlargement: true });
  }

  // sharp afgør det RIGTIGE format ud fra billeddata (meta.format), ikke
  // filens endelse — en .PNG der reelt er et JPEG forbliver et JPEG.
  let outBuffer;
  if (meta.format === 'png') {
    outBuffer = await pipeline.png({ quality: 82, effort: 10, palette: true }).toBuffer();
  } else {
    outBuffer = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  }
  writeFileSync(filePath, outBuffer);

  const webpPath = filePath.replace(/\.[^.]+$/, '.webp');
  const webpBuffer = await sharp(originalBytes)
    .resize(targetWidth < meta.width ? { width: targetWidth, withoutEnlargement: true } : undefined)
    .webp({ quality: 80 })
    .toBuffer();
  writeFileSync(webpPath, webpBuffer);

  const kbAfterMain = Math.round(outBuffer.length / 1024);
  const kbAfterWebp = Math.round(webpBuffer.length / 1024);
  console.log(
    `${relPath}: ${meta.width}x${meta.height} → ${targetWidth}px bred. ` +
    `${kbBefore} KB → ${kbAfterMain} KB (${path.extname(filePath)}), ${kbAfterWebp} KB (webp)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
