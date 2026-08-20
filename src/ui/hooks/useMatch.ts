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
  /**
   * 게임의 정체성. 이 값이 바뀔 때만 새 게임을 시작한다.
   *
   * 이것이 없으면 scenario·engines의 객체 정체성에 의존하게 되어, 호출자가
   * 인라인 객체를 넘기는 순간 매 렌더마다 게임이 새로 만들어진다(무한 루프).
   * 호출자의 메모이제이션에 기대지 않도록 키를 명시적으로 받는다.
   */
  matchKey?: string | number;
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
  const { scenario, agents, engines, turnDelay = 0, matchKey = 0 } = options;

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

  // matchKey가 바뀔 때만 새 게임이다. scenario·engines의 객체 정체성은
  // 보지 않는다 — 호출자가 인라인 객체를 넘겨도 게임이 초기화되지 않는다.
  const latest = useRef({ scenario, agents, engines });
  useEffect(() => {
    latest.current = { scenario, agents, engines };
  }, [scenario, agents, engines]);

  const conductor = useMemo(
    () =>
      createConductor({
        scenario: latest.current.scenario,
        agents: latest.current.agents,
        engines: latest.current.engines,
        // 렌더가 아니라 Conductor의 턴 루프에서 실행되는 콜백이다.
        turnDelay: () => turnDelayRef.current,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [matchKey],
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

    return () => {
      unsubscribe();
      // 구독만 끊으면 턴 루프는 계속 돈다. 아무도 보지 않는 게임이
      // 타이머와 엔진 호출을 계속 소모하고, 실제 API 엔진에서는
      // 곧바로 불필요한 네트워크 비용이 된다.
      conductor.pause();
    };
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
