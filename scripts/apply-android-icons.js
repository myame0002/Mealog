const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const projectRoot = path.join(__dirname, "..");
const assetsDir = path.join(projectRoot, "assets", "images");
const androidRes = path.join(
  projectRoot,
  "android",
  "app",
  "src",
  "main",
  "res",
);

const foregroundPng = path.join(assetsDir, "android-icon-foreground.png");
const backgroundPng = path.join(assetsDir, "android-icon-background.png");
const monoPng = path.join(assetsDir, "android-icon-monochrome.png");

if (!fs.existsSync(foregroundPng) || !fs.existsSync(backgroundPng)) {
  console.error("必要なアイコン画像が assets/images に存在しません。");
  process.exit(1);
}

const densities = [
  { name: "mdpi", size: 48 },
  { name: "hdpi", size: 72 },
  { name: "xhdpi", size: 96 },
  { name: "xxhdpi", size: 144 },
  { name: "xxxhdpi", size: 192 },
];

(async () => {
  try {
    for (const d of densities) {
      const dstDir = path.join(androidRes, `mipmap-${d.name}`);
      if (!fs.existsSync(dstDir)) {
        console.warn("フォルダが見つかりません:", dstDir);
        continue;
      }

      const fgBuf = await sharp(foregroundPng)
        .resize(d.size, d.size, { fit: "contain" })
        .webp()
        .toBuffer();
      const bgBuf = await sharp(backgroundPng)
        .resize(d.size, d.size, { fit: "cover" })
        .webp()
        .toBuffer();
      const monoBuf = await sharp(monoPng)
        .resize(d.size, d.size, { fit: "contain" })
        .webp()
        .toBuffer();

      fs.writeFileSync(path.join(dstDir, "ic_launcher_foreground.webp"), fgBuf);
      fs.writeFileSync(path.join(dstDir, "ic_launcher_background.webp"), bgBuf);
      fs.writeFileSync(
        path.join(dstDir, "ic_launcher_monochrome.webp"),
        monoBuf,
      );

      // composite foreground over background for legacy ic_launcher.webp
      const compositeBuf = await sharp(bgBuf)
        .composite([{ input: fgBuf, gravity: "centre" }])
        .webp()
        .toBuffer();
      fs.writeFileSync(path.join(dstDir, "ic_launcher.webp"), compositeBuf);

      // also copy round variant
      fs.writeFileSync(
        path.join(dstDir, "ic_launcher_round.webp"),
        compositeBuf,
      );

      console.log(`wrote ${d.name} icons`);
    }

    // update mipmap-anydpi-v26 foreground/background XML drawables are already referencing mipmap entries
    console.log(
      "完了: mipmap に画像を上書きしました。Android Studio で Clean/Rebuild してください。",
    );
  } catch (err) {
    console.error("エラー:", err);
    process.exit(1);
  }
})();
