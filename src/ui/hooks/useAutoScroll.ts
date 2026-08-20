/**
 * 새 메시지를 따라 자동으로 스크롤한다.
 *
 * 다만 사용자가 위로 올려 지난 대화를 보고 있으면 멈춘다 — 읽는 도중에
 * 화면이 끌려 내려가면 관전이 불편해진다. 다시 맨 아래로 오면 재개한다.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** 바닥으로 간주하는 여유 픽셀. 스크롤이 정확히 끝에 닿지 않아도 인정한다. */
const BOTTOM_THRESHOLD = 48;

export function useAutoScroll<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T | null>(null);
  const [pinned, setPinned] = useState(true);
  /**
   * 우리가 건 스크롤이 끝나기를 기다리는 중인지.
   *
   * smooth 스크롤은 여러 프레임에 걸쳐 진행되며 그동안 scroll 이벤트가
   * 계속 발생한다. 그 중간값으로 pinned를 계산하면 아직 바닥에 닿지
   * 않았다는 이유로 자동 추적이 꺼져버린다.
   */
  const selfScrolling = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = useCallback(() => {
    if (selfScrolling.current) return;
    const element = ref.current;
    if (!element) return;
    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight;
    setPinned(distance <= BOTTOM_THRESHOLD);
  }, []);

  // 레이아웃 확정 직후에 스크롤한다. useEffect로는 이미 그려진 뒤라
  // 새 메시지가 한 프레임 어긋나 보인다.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !pinned) return;

    selfScrolling.current = true;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });

    // 스크롤이 멎을 때까지 사용자 입력으로 오인하지 않는다.
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      selfScrolling.current = false;
    }, 400);
  }, [dependency, pinned]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  return { ref, pinned, handleScroll };
}
