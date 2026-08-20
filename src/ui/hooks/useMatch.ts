/**
 * Conductor를 React에 연결한다.
 *
 * 코어와 UI의 유일한 경계. Conductor가 방출하는 이벤트를 React 상태로 옮기고,
 * 컴포넌트에는 렌더링에 필요한 것만 노출한다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createConductor, type ConductorStatus } from '../../core/conductor';
import type { Agent, Engine, MatchResult, Scenario, Turn } from '../../core/types';

export interface UseMatchOptions {
  scenario: Scenario;
  agents: [Agent, Agent];
  engines: Record<string, Engine>;
  /** 턴 사이 간격(ms). 관전 속도 조절용. 진행 중에 바꿔도 게임은 이어진다. */
  turnDelay?: number;
}

export interface MatchView {
  status: ConductorStatus;
  /** 시작 단어. 게임 전에는 시나리오가 제시한 값. */
  opening: string;
  turns: Turn[];
  /** 지금 생각 중인 에이전트. 없으면 null. */
  thinkingAgentId: string | null;
  result: MatchResult | null;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

export function useMatch(options: UseMatchOptions): MatchView {
  const { scenario, agents, engines, turnDelay = 0 } = options;

  const [status, setStatus] = useState<ConductorStatus>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinkingAgentId, setThinkingAgentId] = useState<string | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [opening, setOpening] = useState(scenario.openingText);

  /**
   * 속도는 게임의 정체성이 아니라 재생 설정이다. Conductor 의존성에 넣으면
   * 속도를 바꿀 때마다 게임이 처음부터 다시 시작되므로, ref에 담아 두고
   * Conductor가 매 턴 현재 값을 읽게 한다.
   */
  const turnDelayRef = useRef(turnDelay);
  useEffect(() => {
    turnDelayRef.current = turnDelay;
  }, [turnDelay]);

  // scenario·engines가 바뀌면 새 게임이다. 이전 Conductor는 버린다.
  const conductor = useMemo(
    () =>
      createConductor({
        scenario,
        agents,
        engines,
        // 렌더가 아니라 Conductor의 턴 루프에서 실행되는 콜백이다.
        turnDelay: () => turnDelayRef.current,
      }),
    [scenario, agents, engines],
  );

  // Conductor가 교체되면 이전 게임의 화면 상태를 버린다. 렌더 중에 처리해야
  // 새 Conductor의 첫 이벤트가 낡은 상태 위에 얹히지 않는다.
  const [seenConductor, setSeenConductor] = useState(conductor);
  if (seenConductor !== conductor) {
    setSeenConductor(conductor);
    setStatus('idle');
    setTurns([]);
    setThinkingAgentId(null);
    setResult(null);
    setOpening(scenario.openingText);
  }

  useEffect(() => {
    const unsubscribe = conductor.subscribe((event) => {
      switch (event.type) {
        case 'start':
          setOpening(event.opening);
          break;
        case 'thinking':
          setThinkingAgentId(event.agentId);
          break;
        case 'turn':
          // 턴이 확정되면 생각 중 표시를 끈다.
          setThinkingAgentId(null);
          setTurns((previous) => [...previous, event.turn]);
          break;
        case 'finish':
          setThinkingAgentId(null);
          setResult(event.result);
          break;
        case 'status':
          setStatus(event.status);
          break;
      }
    });

    return unsubscribe;
  }, [conductor]);

  const start = useCallback(() => {
    void conductor.start();
  }, [conductor]);

  const pause = useCallback(() => {
    conductor.pause();
  }, [conductor]);

  const resume = useCallback(() => {
    void conductor.resume();
  }, [conductor]);

  const reset = useCallback(() => {
    conductor.reset();
    setTurns([]);
    setThinkingAgentId(null);
    setResult(null);
  }, [conductor]);

  return {
    status,
    opening,
    turns,
    thinkingAgentId,
    result,
    start,
    pause,
    resume,
    reset,
  };
}
