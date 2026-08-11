/**
 * Genera icon.png, adaptive-icon.png, splash, favicon desde src/assets/e_icono.png
 * Uso: npm run generate:icons
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "src", "assets", "e_icono.png");
const assetsDir = path.join(root, "assets");
const sourceBackup = path.join(assetsDir, "icon-source.png");

const BRAND_BG = { r: 15, g: 15, b: 15, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

if (!fs.existsSync(source)) {
  console.error("No se encontró el logo fuente:", source);
  process.exit(1);
}

fs.mkdirSync(assetsDir, { recursive: true });
fs.copyFileSync(source, sourceBackup);

async function loadLogo(size) {
  return sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: TRANSPARENT,
    })
    .png()
    .toBuffer();
}

async function writeSquareIcon(outputPath, size, logoScale, background) {
  const logoSize = Math.round(size * logoScale);
  const logo = await loadLogo(logoSize);
  const offset = Math.round((size - logoSize) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(outputPath);

  console.log("✓", path.relative(root, outputPath), `${size}x${size}`);
}

async function writeAdaptiveForeground(outputPath, size = 1024) {
  const logoSize = Math.round(size * 0.52);
  const logo = await loadLogo(logoSize);
  const offset = Math.round((size - logoSize) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: TRANSPARENT,
    },
  })
    .composite([{ input: logo, left: offset, top: offset }])
    .png()
    .toFile(outputPath);

  console.log("✓", path.relative(root, outputPath), "adaptive foreground");
}

async function writeSplash(outputPath, width = 1284, height = 2778) {
  const logoSize = Math.round(Math.min(width, height) * 0.38);
  const logo = await loadLogo(logoSize);
  const left = Math.round((width - logoSize) / 2);
  const top = Math.round((height - logoSize) / 2);

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BRAND_BG,
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toFile(outputPath);

  console.log("✓", path.relative(root, outputPath), `${width}x${height}`);
}

async function main() {
  console.log("Generando iconos Kinecat desde e_icono.png…\n");

  await writeSquareIcon(path.join(assetsDir, "icon.png"), 1024, 0.62, BRAND_BG);
  await writeAdaptiveForeground(path.join(assetsDir, "adaptive-icon.png"));
  await writeSquareIcon(path.join(assetsDir, "splash-icon.png"), 512, 0.7, TRANSPARENT);
  await writeSplash(path.join(assetsDir, "splash.png"));
  await writeSquareIcon(path.join(assetsDir, "favicon.png"), 48, 0.78, BRAND_BG);

  console.log("\nListo. Reconstruí la app nativa si ya la tenías instalada:");
  console.log("  npx expo prebuild --clean");
  console.log("  npx expo run:android   (o run:ios)");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
