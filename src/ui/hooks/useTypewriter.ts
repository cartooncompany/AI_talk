/**
 * 글자가 하나씩 나타나는 연출.
 *
 * 관전 경험의 핵심. 발화가 한 번에 툭 나오면 지켜볼 것이 없다.
 *
 * 접근성: 사용자가 동작 줄이기를 켜두었으면 즉시 전체를 보여준다.
 */

import { useEffect, useRef, useState } from 'react';

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
  const [shown, setShown] = useState('');
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    if (!enabled || reduced.current || text.length === 0) {
      setShown(text);
      return;
    }

    setShown('');
    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setShown(text.slice(0, index));
      if (index >= text.length) clearInterval(timer);
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return { shown, done: shown.length >= text.length };
}
