const sharp = require('sharp');
const path = require('path');

const INPUT = path.join(__dirname, '..', 'assets/images/MeaLog_icon.png');
const OUTPUT_FOREGROUND = path.join(__dirname, '..', 'assets/images/android-icon-foreground.png');
const OUTPUT_BACKGROUND = path.join(__dirname, '..', 'assets/images/android-icon-background.png');
const OUTPUT_MONOCHROME = path.join(__dirname, '..', 'assets/images/android-icon-monochrome.png');

async function main() {
  const metadata = await sharp(INPUT).metadata();
  const size = metadata.width;

  // Android Adaptive Icon のセーフゾーンは中央66%
  // 画像全体を表示するには、元の画像をキャンバスの約66%の領域に収める必要がある
  // スケールファクターを1.3に調整して、アイコンを少し小さく表示
  const scaleFactor = 1.3;
  const newSize = Math.round(size * scaleFactor);
  const offset = Math.round((newSize - size) / 2);

  console.log(`元の画像サイズ: ${size}x${size}`);
  console.log(`拡大キャンバス: ${newSize}x${newSize}`);
  console.log(`オフセット: ${offset}px`);

  // foreground: 元の画像を中央に配置（周囲は透過）
  await sharp({
    create: {
      width: newSize,
      height: newSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{
      input: INPUT,
      top: offset,
      left: offset
    }])
    .png()
    .toFile(OUTPUT_FOREGROUND);

  console.log(`✅ 生成: ${OUTPUT_FOREGROUND}`);

  // background: 現在の backgroundColor #E6F4FE の単色画像
  await sharp({
    create: {
      width: newSize,
      height: newSize,
      channels: 4,
      background: { r: 0xE6, g: 0xF4, b: 0xFE, alpha: 1 }
    }
  })
    .png()
    .toFile(OUTPUT_BACKGROUND);

  console.log(`✅ 生成: ${OUTPUT_BACKGROUND}`);

  // monochrome: foregroundをグレースケール化
  await sharp(OUTPUT_FOREGROUND)
    .greyscale()
    .png()
    .toFile(OUTPUT_MONOCHROME);

  console.log(`✅ 生成: ${OUTPUT_MONOCHROME}`);
  console.log('\n完了！ app.json の android.adaptiveIcon を更新してください。');
}

main().catch(err => {
  console.error('エラー:', err);
  process.exit(1);
});