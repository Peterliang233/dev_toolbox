import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ICON_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+W4sQAAAAASUVORK5CYII=";

async function main() {
  const iconsDir = resolve(process.cwd(), "public/icons");
  await mkdir(iconsDir, { recursive: true });

  const buf = Buffer.from(ICON_BASE64, "base64");
  await Promise.all([
    writeFile(resolve(iconsDir, "icon16.png"), buf),
    writeFile(resolve(iconsDir, "icon48.png"), buf),
    writeFile(resolve(iconsDir, "icon128.png"), buf)
  ]);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

