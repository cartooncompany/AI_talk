import { describe, expect, it } from 'vitest';
import { createConductor, type ConductorEvent } from './conductor';
import { createMockEngine, createScriptedEngine } from './engines/mock';
import { createWordChain } from './scenarios/wordchain';
import type { Agent, Engine } from './types';

const AGENTS: [Agent, Agent] = [
  { id: 'a', name: '에이', emoji: '🅰️', color: '#c96442' },
  { id: 'b', name: '비이', emoji: '🅱️', color: '#10a37f' },
];

function setup(scriptA: string[], scriptB: string[], openingWord = '사과', maxTurns = 50) {
  const scenario = createWordChain({ openingWord, maxTurns });
  const events: ConductorEvent[] = [];
  const conductor = createConductor({
    scenario,
    agents: AGENTS,
    engines: {
      a: createScriptedEngine(scriptA),
      b: createScriptedEngine(scriptB),
    },
  });
  conductor.subscribe((event) => events.push(event));
  return { conductor, events, scenario };
}

describe('턴 진행', () => {
  it('에이전트가 번갈아 발화한다', async () => {
    const { conductor } = setup(['과자', '연필'], ['자연', '필통']);
    await conductor.start();
    const ids = conductor.getState().turns.map((t) => t.agentId);
    expect(ids.slice(0, 4)).toEqual(['a', 'b', 'a', 'b']);
  });

  it('유효한 발화는 valid로 기록된다', async () => {
    const { conductor } = setup(['과자'], ['자연']);
    await conductor.start();
    const [first] = conductor.getState().turns;
    expect(first.valid).toBe(true);
    expect(first.text).toBe('과자');
  });

  it('규칙 위반이 나오면 게임이 끝난다', async () => {
    const { conductor } = setup(['과자'], ['바나나']);
    await conductor.start();
    const state = conductor.getState();
    expect(state.result?.reason).toBe('rule-violation');
    expect(state.result?.winnerId).toBe('a');
    expect(conductor.getStatus()).toBe('finished');
  });

  it('턴 제한에 도달하면 무승부로 끝난다', async () => {
    const { conductor } = setup(['과자', '연필'], ['자연', '필통'], '사과', 4);
    await conductor.start();
    const state = conductor.getState();
    expect(state.turns).toHaveLength(4);
    expect(state.result?.reason).toBe('turn-limit');
    expect(state.result?.winnerId).toBeNull();
  });
});

describe('이벤트', () => {
  it('start → thinking → turn → finish 순으로 방출한다', async () => {
    const { conductor, events } = setup(['과자'], ['바나나']);
    await conductor.start();
    const types = events.map((e) => e.type);
    expect(types[0]).toBe('status');
    expect(types).toContain('start');
    expect(types).toContain('thinking');
    expect(types).toContain('turn');
    expect(types[types.length - 1]).toBe('finish');
  });

  it('구독을 해제하면 더 이상 받지 않는다', async () => {
    const scenario = createWordChain({ openingWord: '사과' });
    const received: ConductorEvent[] = [];
    const conductor = createConductor({
      scenario,
      agents: AGENTS,
      engines: {
        a: createScriptedEngine(['과자']),
        b: createScriptedEngine(['바나나']),
      },
    });
    const unsubscribe = conductor.subscribe((e) => received.push(e));
    unsubscribe();
    await conductor.start();
    expect(received).toHaveLength(0);
  });

  it('thinking 이벤트가 발화 직전에 나온다', async () => {
    const { conductor, events } = setup(['과자'], ['바나나']);
    await conductor.start();
    const thinkingIndex = events.findIndex((e) => e.type === 'thinking');
    const turnIndex = events.findIndex((e) => e.type === 'turn');
    expect(thinkingIndex).toBeGreaterThanOrEqual(0);
    expect(thinkingIndex).toBeLessThan(turnIndex);
  });
});

describe('상태 제어', () => {
  it('reset하면 처음 상태로 돌아간다', async () => {
    const { conductor } = setup(['과자'], ['바나나']);
    await conductor.start();
    expect(conductor.getState().turns.length).toBeGreaterThan(0);
    conductor.reset();
    expect(conductor.getState().turns).toHaveLength(0);
    expect(conductor.getState().result).toBeNull();
    expect(conductor.getStatus()).toBe('idle');
  });

  it('끝난 게임은 다시 start해도 진행되지 않는다', async () => {
    const { conductor } = setup(['과자'], ['바나나']);
    await conductor.start();
    const count = conductor.getState().turns.length;
    await conductor.start();
    expect(conductor.getState().turns).toHaveLength(count);
  });

  it('진행 중이 아니면 pause는 무시된다', () => {
    const { conductor } = setup(['과자'], ['자연']);
    conductor.pause();
    expect(conductor.getStatus()).toBe('idle');
  });
});

describe('엔진 오류 처리', () => {
  it('엔진이 실패해도 게임이 멈추지 않고 규칙 위반으로 처리된다', async () => {
    const failing: Engine = {
      label: 'Failing',
      generate: () => Promise.reject(new Error('네트워크 오류')),
    };
    const scenario = createWordChain({ openingWord: '사과' });
    const conductor = createConductor({
      scenario,
      agents: AGENTS,
      engines: { a: failing, b: createScriptedEngine(['자연']) },
    });
    await conductor.start();
    const state = conductor.getState();
    expect(state.turns[0].valid).toBe(false);
    expect(state.result?.reason).toBe('rule-violation');
    expect(state.result?.winnerId).toBe('b');
  });

  it('엔진이 없는 에이전트는 게임을 끝낸다', async () => {
    const scenario = createWordChain({ openingWord: '사과' });
    const conductor = createConductor({
      scenario,
      agents: AGENTS,
      engines: { b: createScriptedEngine(['자연']) },
    });
    await conductor.start();
    expect(conductor.getStatus()).toBe('finished');
  });
});

describe('Mock 엔진과의 통합', () => {
  it('같은 시드는 같은 게임을 재현한다', async () => {
    const play = async () => {
      const scenario = createWordChain({ openingWord: '사과', maxTurns: 50 });
      const conductor = createConductor({
        scenario,
        agents: AGENTS,
        engines: {
          a: createMockEngine({ seed: 12345, wait: false }),
          b: createMockEngine({ seed: 54321, wait: false }),
        },
      });
      await conductor.start();
      return conductor.getState().turns.map((t) => t.text);
    };
    expect(await play()).toEqual(await play());
  });

  it('게임이 반드시 끝난다 — 무한 루프가 없다', async () => {
    for (let seed = 0; seed < 30; seed += 1) {
      const scenario = createWordChain({ maxTurns: 50 });
      const conductor = createConductor({
        scenario,
        agents: AGENTS,
        engines: {
          a: createMockEngine({ seed, wait: false }),
          b: createMockEngine({ seed: seed + 500, wait: false }),
        },
      });
      await conductor.start();
      const state = conductor.getState();
      expect(state.result).not.toBeNull();
      expect(state.turns.length).toBeLessThanOrEqual(50);
    }
  });
});
