/**
 * 글자가 하나씩 나타나는 연출.
 *
 * 관전 경험의 핵심. 발화가 한 번에 툭 나오면 지켜볼 것이 없다.
 *
 * 접근성: 사용자가 동작 줄이기를 켜두었으면 즉시 전체를 보여준다.
 */

import { useEffect, useState } from 'react';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface TypewriterOptions {
  /** 글자당 간격(ms). 기본 55. */
  speed?: number;
  /** false면 애니메이션 없이 전체를 즉시 보여준다. */
  enabled?: boolean;
}

/** 타이핑 중인 부분 문자열과 완료 여부를 반환한다. */
export function useTypewriter(
  text: string,
  options: TypewriterOptions = {},
): { shown: string; done: boolean } {
  const { speed = 55, enabled = true } = options;
  // 마운트 시점에 한 번만 읽는다. 렌더 중에도 안전하게 참조하기 위해
  // ref가 아니라 state로 둔다.
  const [reduced] = useState(prefersReducedMotion);

  /**
   * 보여줄 문자열과 완료 여부를 한 상태로 묶는다.
   *
   * done을 `shown.length >= text.length`로 유도하면, text가 짧은 값으로
   * 바뀐 렌더에서 shown은 아직 이전(더 긴) 값이라 done이 잘못 true가 된다.
   * 두 값이 항상 같은 시점을 가리키도록 함께 갱신한다.
   */
  const settle = enabled && !reduced && text.length > 0;
  const [state, setState] = useState(() =>
    settle ? { text, shown: '', done: false } : { text, shown: text, done: true },
  );

  useEffect(() => {
    // 애니메이션이 없는 경우엔 아무것도 하지 않는다. 렌더 중 파생이
    // 이미 전체 문자열을 완료 상태로 돌려준다.
    if (!settle) return;

    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      const slice = text.slice(0, index);
      setState({ text, shown: slice, done: index >= text.length });
      if (index >= text.length) clearInterval(timer);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, settle]);

  // text가 막 바뀐 렌더에서는 아직 이전 값이 담겨 있다. 그 한 프레임 동안
  // 낡은 문자열을 완료된 것처럼 보이지 않게 한다.
  if (state.text !== text) {
    return settle ? { shown: '', done: false } : { shown: text, done: true };
  }
  return { shown: state.shown, done: state.done };
}
