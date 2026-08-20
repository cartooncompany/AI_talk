/**
 * 대화 진행자.
 *
 * 턴 루프를 돌린다. 누구 차례인지 정하고, 엔진에게 발화를 요청하고,
 * Scenario에게 판정을 맡기고, 끝났는지 확인한다.
 *
 * 발화 생성(Engine)도 규칙 판정(Scenario)도 직접 하지 않는다. 인터페이스로만
 * 호출하므로 Mock을 실제 API로 바꿔도 이 파일은 그대로다.
 *
 * React에 의존하지 않는다. UI는 subscribe()로 상태 변화를 구독한다.
 */

import type {
  Agent,
  Engine,
  MatchResult,
  MatchState,
  Scenario,
  Turn,
} from './types';

export type ConductorStatus = 'idle' | 'running' | 'paused' | 'finished';

/** UI가 구독하는 이벤트. */
export type ConductorEvent =
  /** 게임이 시작됐다. */
  | { type: 'start'; opening: string }
  /** 발화자가 생각을 시작했다. 타이핑 인디케이터를 켜는 시점. */
  | { type: 'thinking'; agentId: string }
  /** 턴이 끝났다. 유효 여부는 turn.valid로 판단한다. */
  | { type: 'turn'; turn: Turn }
  /** 게임이 끝났다. */
  | { type: 'finish'; result: MatchResult }
  /** 일시정지 또는 재개. */
  | { type: 'status'; status: ConductorStatus };

export interface ConductorOptions {
  scenario: Scenario;
  agents: [Agent, Agent];
  /** 에이전트 id → 엔진. 두 에이전트 모두에 대한 엔진이 있어야 한다. */
  engines: Record<string, Engine>;
  /**
   * 턴 사이에 추가로 쉬는 시간(ms). 관전 속도 조절용. 기본 0.
   *
   * 함수로 넘기면 매 턴 현재 값을 읽는다. 속도는 게임의 정체성이 아니라
   * 재생 설정이므로, 진행 중에 바꿔도 게임이 이어져야 한다.
   */
  turnDelay?: number | (() => number);
}

export interface Conductor {
  getState(): MatchState;
  getStatus(): ConductorStatus;
  /** 상태 변화를 구독한다. 반환된 함수를 호출하면 구독이 해제된다. */
  subscribe(listener: (event: ConductorEvent) => void): () => void;
  /** 게임을 시작한다. 이미 진행 중이면 무시한다. */
  start(): Promise<void>;
  /** 일시정지. 진행 중인 턴은 끝까지 마친 뒤 멈춘다. */
  pause(): void;
  /** 재개. */
  resume(): Promise<void>;
  /** 처음 상태로 되돌린다. */
  reset(): void;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createConductor(options: ConductorOptions): Conductor {
  const { scenario, agents, engines } = options;
  const readTurnDelay = (): number => {
    const value = options.turnDelay ?? 0;
    return typeof value === 'function' ? value() : value;
  };

  let turns: Turn[] = [];
  let status: ConductorStatus = 'idle';
  let result: MatchResult | null = null;
  let currentIndex = 0;
  /** 루프가 이미 돌고 있는지. 중복 실행을 막는다. */
  let looping = false;

  const listeners = new Set<(event: ConductorEvent) => void>();

  const emit = (event: ConductorEvent): void => {
    for (const listener of listeners) listener(event);
  };

  const setStatus = (next: ConductorStatus): void => {
    if (status === next) return;
    status = next;
    emit({ type: 'status', status });
  };

  const finish = (outcome: MatchResult): void => {
    result = outcome;
    setStatus('finished');
    emit({ type: 'finish', result: outcome });
  };

  /**
   * 턴 하나를 진행한다. 게임이 끝났으면 true.
   *
   * 엔진 호출은 실패할 수 있다(실제 API에서는 네트워크 오류). 그 경우
   * 발화하지 못한 것으로 처리해 게임이 멈추지 않게 한다.
   */
  const step = async (): Promise<boolean> => {
    const agent = agents[currentIndex % agents.length];
    const engine = engines[agent.id];
    if (!engine) {
      finish({
        reason: 'scenario-complete',
        winnerId: null,
        summary: `${agent.name}에 연결된 엔진이 없다.`,
      });
      return true;
    }

    emit({ type: 'thinking', agentId: agent.id });

    const opponent = agents[(currentIndex + 1) % agents.length];
    let text: string;
    let thinkingTime: number;

    try {
      const response = await engine.generate({
        self: agent,
        opponent,
        history: turns,
        instruction: scenario.instructionFor(turns),
      });
      text = response.text;
      thinkingTime = response.thinkingTime;
    } catch (error) {
      text = '';
      thinkingTime = 0;
      // 발화 실패는 빈 문자열로 넘겨 Scenario가 규칙 위반으로 판정하게 한다.
      // 어느 쪽이 왜 실패했는지는 turn.reason에 남는다.
      void error;
    }

    const judgement = scenario.judge(text, turns);
    const turn: Turn = {
      index: turns.length,
      agentId: agent.id,
      text,
      valid: judgement.valid,
      reason: judgement.valid ? undefined : judgement.reason,
      thinkingTime,
    };

    turns = [...turns, turn];
    currentIndex += 1;
    emit({ type: 'turn', turn });

    const outcome = scenario.checkCompletion(turns, agents);
    if (outcome) {
      finish(outcome);
      return true;
    }
    return false;
  };

  /** 멈추라는 신호가 올 때까지 턴을 반복한다. */
  const runLoop = async (): Promise<void> => {
    if (looping) return;
    looping = true;
    try {
      while (status === 'running') {
        const done = await step();
        if (done) break;
        const delay = readTurnDelay();
        if (delay > 0 && status === 'running') await sleep(delay);
      }
    } finally {
      looping = false;
    }
  };

  return {
    getState(): MatchState {
      const next = status === 'finished' ? null : agents[currentIndex % agents.length].id;
      return { agents, turns, currentAgentId: next, result };
    },

    getStatus: () => status,

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    async start() {
      if (status === 'running' || status === 'finished') return;
      const fresh = status === 'idle';
      setStatus('running');
      if (fresh) emit({ type: 'start', opening: scenario.openingText });
      await runLoop();
    },

    pause() {
      if (status !== 'running') return;
      setStatus('paused');
    },

    async resume() {
      if (status !== 'paused') return;
      setStatus('running');
      await runLoop();
    },

    reset() {
      turns = [];
      currentIndex = 0;
      result = null;
      status = 'idle';
      emit({ type: 'status', status });
    },
  };
}
