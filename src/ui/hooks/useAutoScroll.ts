/**
 * 새 메시지를 따라 자동으로 스크롤한다.
 *
 * 다만 사용자가 위로 올려 지난 대화를 보고 있으면 멈춘다 — 읽는 도중에
 * 화면이 끌려 내려가면 관전이 불편해진다. 다시 맨 아래로 오면 재개한다.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/** 바닥으로 간주하는 여유 픽셀. 스크롤이 정확히 끝에 닿지 않아도 인정한다. */
const BOTTOM_THRESHOLD = 48;

/**
 * 우리가 건 스크롤과 사용자의 스크롤을 구분하는 여유.
 *
 * smooth 스크롤은 여러 프레임에 걸쳐 진행되고 그동안 scroll 이벤트가 계속
 * 발생한다. 그 중간값으로 "바닥에 있는지"를 판정하면 아직 도착하지 않았다는
 * 이유로 자동 추적이 잘못 꺼진다. 그렇다고 일정 시간 이벤트를 통째로
 * 무시하면, 그 사이의 진짜 사용자 스크롤까지 삼켜 바닥에 묶어버린다.
 *
 * 그래서 시간이 아니라 방향으로 구분한다. 우리가 목표로 삼은 바닥보다
 * 위로 이만큼 넘게 올라가면 사용자가 올린 것으로 본다.
 */
const USER_SCROLL_MARGIN = 24;

export function useAutoScroll<T extends HTMLElement>(dependency: unknown) {
  const ref = useRef<T | null>(null);
  const [pinned, setPinned] = useState(true);
  /** 우리가 스크롤을 걸어둔 목표 위치. 사용자 스크롤 판별의 기준이 된다. */
  const target = useRef(0);

  const handleScroll = useCallback(() => {
    const element = ref.current;
    if (!element) return;

    const distance =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (distance <= BOTTOM_THRESHOLD) {
      setPinned(true);
      return;
    }

    // 우리가 건 smooth 스크롤이 아직 목표에 도달하지 못한 중간 프레임인지,
    // 사용자가 실제로 위로 올린 것인지 구분한다.
    const movingToTarget = element.scrollTop >= target.current - USER_SCROLL_MARGIN;
    if (!movingToTarget) setPinned(false);
  }, []);

  // 레이아웃 확정 직후에 스크롤한다. useEffect로는 이미 그려진 뒤라
  // 새 메시지가 한 프레임 어긋나 보인다.
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !pinned) return;
    target.current = element.scrollHeight - element.clientHeight;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
  }, [dependency, pinned]);

  /**
   * 말풍선이 타이핑되며 높이가 자라는 동안에도 바닥을 따라간다.
   *
   * 타이핑은 dependency를 바꾸지 않으므로 위 효과만으로는 새 글자가
   * 화면 아래로 밀려나도 스크롤이 그대로 멈춰 있다.
   */
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      if (!pinned) return;
      target.current = element.scrollHeight - element.clientHeight;
      element.scrollTop = element.scrollHeight;
    });
    observer.observe(element);
    for (const child of Array.from(element.children)) observer.observe(child);

    return () => observer.disconnect();
  }, [dependency, pinned]);

  return { ref, pinned, handleScroll };
}
