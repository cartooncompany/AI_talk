/**
 * 한글 음절 처리.
 *
 * 끝말잇기 판정의 토대. 유니코드 한글 음절 영역(가~힣)은
 * `0xAC00 + 초성*588 + 중성*28 + 종성` 규칙으로 구성되므로 산술로 분해·조합한다.
 */

const SYLLABLE_BASE = 0xac00;
const SYLLABLE_LAST = 0xd7a3;
const MEDIAL_COUNT = 21;
const FINAL_COUNT = 28;

/** 초성 19자. 인덱스가 곧 초성 번호다. */
export const INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

/** 중성 21자. */
export const MEDIALS = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
] as const;

/** 종성 28자. 첫 항목은 받침 없음을 뜻한다. */
export const FINALS = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
] as const;

/** 음절 하나를 초·중·종성으로 나눈 결과. */
export interface Syllable {
  initial: string;
  medial: string;
  /** 받침이 없으면 빈 문자열. */
  final: string;
}

/** 완성형 한글 음절(가~힣)인지. 자모 단독('ㄱ')이나 공백은 false. */
export function isHangulSyllable(char: string): boolean {
  if (char.length !== 1) return false;
  const code = char.charCodeAt(0);
  return code >= SYLLABLE_BASE && code <= SYLLABLE_LAST;
}

/** 문자열 전체가 완성형 한글 음절로만 이뤄졌는지. 빈 문자열은 false. */
export function isHangulWord(text: string): boolean {
  return text.length > 0 && [...text].every(isHangulSyllable);
}

/** 음절을 초·중·종성으로 분해한다. 완성형 음절이 아니면 null. */
export function decompose(char: string): Syllable | null {
  if (!isHangulSyllable(char)) return null;
  const offset = char.charCodeAt(0) - SYLLABLE_BASE;
  return {
    initial: INITIALS[Math.floor(offset / (MEDIAL_COUNT * FINAL_COUNT))],
    medial: MEDIALS[Math.floor(offset / FINAL_COUNT) % MEDIAL_COUNT],
    final: FINALS[offset % FINAL_COUNT],
  };
}

/** 초·중·종성을 음절로 합친다. 알 수 없는 자모가 있으면 null. */
export function compose(syllable: Syllable): string | null {
  const i = INITIALS.indexOf(syllable.initial as (typeof INITIALS)[number]);
  const m = MEDIALS.indexOf(syllable.medial as (typeof MEDIALS)[number]);
  const f = FINALS.indexOf(syllable.final as (typeof FINALS)[number]);
  if (i < 0 || m < 0 || f < 0) return null;
  return String.fromCharCode(
    SYLLABLE_BASE + i * MEDIAL_COUNT * FINAL_COUNT + m * FINAL_COUNT + f,
  );
}

/** 단어의 첫 글자. 빈 문자열이면 빈 문자열. */
export function firstChar(word: string): string {
  return word.charAt(0);
}

/** 단어의 끝 글자. 빈 문자열이면 빈 문자열. */
export function lastChar(word: string): string {
  return word.charAt(word.length - 1);
}
