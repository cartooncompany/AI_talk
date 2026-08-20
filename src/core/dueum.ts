/**
 * 두음법칙.
 *
 * 한국어에서 단어 첫머리의 ㄹ·ㄴ이 바뀌는 규칙. 끝말잇기에서는 보통
 * 이를 허용해서 "실락원 → 낙원"이 아니라 "락"으로 끝났을 때 "낙"으로도
 * 시작할 수 있게 한다.
 *
 * 규칙 (표준어 규정 제5장):
 *   ㄹ + ㅑㅕㅛㅠㅣㅐㅖ  →  ㅇ   (락 → 낙 → 악이 아니라, 려 → 여)
 *   ㄹ + 그 외 모음      →  ㄴ   (락 → 낙)
 *   ㄴ + ㅑㅕㅛㅠㅣ      →  ㅇ   (녀 → 여)
 *
 * 이 모듈은 "이 글자로 시작할 수 있는 대안 글자들"을 구하는 데 쓴다.
 */

import { compose, decompose } from './hangul';

/** ㄹ/ㄴ이 ㅇ으로 바뀌는 중성들. */
const YOTIZED = new Set(['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ', 'ㅣ', 'ㅐ', 'ㅖ']);

/** ㄴ이 ㅇ으로 바뀌는 중성들. ㅐㅖ는 포함하지 않는다. */
const YOTIZED_FOR_N = new Set(['ㅑ', 'ㅕ', 'ㅛ', 'ㅠ', 'ㅣ']);

/**
 * 두음법칙을 적용한 글자를 반환한다. 해당하지 않으면 null.
 *
 * 예: 락 → 낙, 려 → 여, 녀 → 여
 */
export function applyDueum(char: string): string | null {
  const syllable = decompose(char);
  if (!syllable) return null;

  const { initial, medial } = syllable;

  if (initial === 'ㄹ') {
    const next = YOTIZED.has(medial) ? 'ㅇ' : 'ㄴ';
    return compose({ ...syllable, initial: next });
  }

  if (initial === 'ㄴ' && YOTIZED_FOR_N.has(medial)) {
    return compose({ ...syllable, initial: 'ㅇ' });
  }

  return null;
}

/**
 * 주어진 글자를 이어받을 때 시작 글자로 쓸 수 있는 모든 글자.
 *
 * 원래 글자를 항상 포함하고, 두음법칙이 적용되면 그 결과도 포함한다.
 * ㄹ → ㄴ → ㅇ 처럼 연쇄되는 경우(례 → 녜 → 예)도 따라간다.
 */
export function allowedStarts(char: string): string[] {
  const results = [char];
  let current = char;

  // 연쇄 변환. ㄹ→ㄴ→ㅇ이 최대 깊이이므로 실질적으로 2회면 끝난다.
  for (let i = 0; i < 2; i += 1) {
    const next = applyDueum(current);
    if (!next || results.includes(next)) break;
    results.push(next);
    current = next;
  }

  return results;
}
