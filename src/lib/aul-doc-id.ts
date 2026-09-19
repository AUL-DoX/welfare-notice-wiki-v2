const PREFIX = "AD";
const SEQUENCE_DIGITS = 6;

/**
 * Luhnアルゴリズム（ISO/IEC 7812、クレジットカード番号等で使われる方式）で
 * チェックデジットを算出する。1桁の誤入力や隣接桁の入れ替えミスを検出できる。
 */
export function computeLuhnCheckDigit(digits: string): number {
  let sum = 0;
  let double = true; // 右端の桁から数えて偶数番目（=末尾のすぐ左）を2倍する
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let value = digits.charCodeAt(i) - 48; // "0"のコードポイント
    if (double) {
      value *= 2;
      if (value > 9) value -= 9;
    }
    sum += value;
    double = !double;
  }
  return (10 - (sum % 10)) % 10;
}

export type AulDocId = string; // 例: "AD-000123-7"

export function formatAulDocId(sequence: number): AulDocId {
  if (!Number.isInteger(sequence) || sequence < 0) {
    throw new Error(`invalid sequence: ${sequence}`);
  }
  const digits = String(sequence).padStart(SEQUENCE_DIGITS, "0");
  if (digits.length > SEQUENCE_DIGITS) {
    throw new Error(`sequence overflow (max ${SEQUENCE_DIGITS} digits): ${sequence}`);
  }
  const checkDigit = computeLuhnCheckDigit(digits);
  return `${PREFIX}-${digits}-${checkDigit}`;
}

export function isValidAulDocId(docId: string): boolean {
  const match = /^AD-(\d{6})-(\d)$/.exec(docId.trim());
  if (!match) return false;
  const [, digits, checkDigit] = match;
  return computeLuhnCheckDigit(digits) === Number(checkDigit);
}

export function parseAulDocId(docId: string): { sequence: number } | null {
  if (!isValidAulDocId(docId)) return null;
  const match = /^AD-(\d{6})-\d$/.exec(docId.trim());
  if (!match) return null;
  return { sequence: Number(match[1]) };
}
