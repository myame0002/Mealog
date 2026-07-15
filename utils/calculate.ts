// 数式入力（例: 123*1.5）を評価して数値に変換する共通ユーティリティ

export const calculateValue = (input: string): number => {
  const trimmed = input.trim();

  if (!trimmed) return 0;

  // 演算子が含まれている場合は計算式として評価
  if (/[+\-*/]/.test(trimmed)) {
    try {
      // 安全のため、数値、演算子（+-*/）、括弧、小数点のみ許可
      const sanitized = trimmed.replace(/[^0-9+\-*/().]/g, "");
      if (sanitized !== trimmed) {
        throw new Error("Invalid characters");
      }

      // Functionコンストラクタを使用（evalより安全）
      const result = new Function("return " + sanitized)();

      if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
        return Math.round(result * 100) / 100; // 小数点2桁まで
      }
    } catch (error) {
      console.error("Calculation error:", error);
    }
    return 0;
  }

  // 演算子がない場合は直接数値としてパース
  const directNumber = parseFloat(trimmed);
  if (!isNaN(directNumber)) {
    return directNumber;
  }

  return 0;
};