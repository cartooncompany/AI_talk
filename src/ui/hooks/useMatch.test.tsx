/** @vitest-environment happy-dom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMatch } from './useMatch';
import { createScriptedEngine } from '../../core/engines/mock';
import { createWordChain } from '../../core/scenarios/wordchain';
import type { Agent, Engine } from '../../core/types';

const AGENTS: [Agent, Agent] = [
  { id: 'a', name: '에이', emoji: '🅰️', color: '#c96442' },
  { id: 'b', name: '비이', emoji: '🅱️', color: '#10a37f' },
];

function setup(scriptA: string[], scriptB: string[], maxTurns = 50) {
  const scenario = createWordChain({ openingWord: '사과', maxTurns });
  const engines = {
    a: createScriptedEngine(scriptA),
    b: createScriptedEngine(scriptB),
  };
  return renderHook(
    ({ turnDelay }: { turnDelay: number }) =>
      useMatch({ scenario, agents: AGENTS, engines, turnDelay }),
    { initialProps: { turnDelay: 0 } },
  );
}

describe('useMatch', () => {
  it('처음에는 idle이고 턴이 없다', () => {
    const { result } = setup(['과자'], ['자연']);
    expect(result.current.status).toBe('idle');
    expect(result.current.turns).toHaveLength(0);
    expect(result.current.result).toBeNull();
  });

  it('시나리오의 시작 단어를 노출한다', () => {
    const { result } = setup(['과자'], ['자연']);
    expect(result.current.opening).toBe('사과');
  });

  it('start하면 턴이 쌓이고 결과가 나온다', async () => {
    const { result } = setup(['과자'], ['바나나']);
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('finished'));
    expect(result.current.turns.length).toBeGreaterThan(0);
    expect(result.current.result?.winnerId).toBe('a');
  });

  it('게임이 끝나면 thinking 표시가 꺼진다', async () => {
    const { result } = setup(['과자'], ['바나나']);
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('finished'));
    expect(result.current.thinkingAgentId).toBeNull();
  });

  it('reset하면 처음 상태로 돌아간다', async () => {
    const { result } = setup(['과자'], ['바나나']);
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('finished'));

    act(() => {
      result.current.reset();
    });
    expect(result.current.turns).toHaveLength(0);
    expect(result.current.result).toBeNull();
    expect(result.current.status).toBe('idle');
  });

  it('턴 제한에 도달하면 무승부로 끝난다', async () => {
    const { result } = setup(['과자', '연필'], ['자연', '필통'], 4);
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.status).toBe('finished'));
    expect(result.current.result?.reason).toBe('turn-limit');
    expect(result.current.result?.winnerId).toBeNull();
  });

  it('진행 중에 속도를 바꿔도 게임이 리셋되지 않는다', async () => {
    // 회귀: turnDelay가 Conductor 의존성에 있으면 속도를 바꿀 때마다
    // Conductor가 새로 만들어져 보던 대화가 사라졌다.
    const { result, rerender } = setup(['과자', '연필'], ['자연', '필통'], 4);
    await act(async () => {
      result.current.start();
    });
    await waitFor(() => expect(result.current.turns.length).toBeGreaterThan(0));
    const before = result.current.turns.length;

    rerender({ turnDelay: 500 });

    expect(result.current.turns).toHaveLength(before);
    expect(result.current.status).not.toBe('idle');
  });

  it('언마운트해도 오류가 나지 않는다', async () => {
    const { result, unmount } = setup(['과자'], ['바나나']);
    await act(async () => {
      result.current.start();
    });
    expect(() => unmount()).not.toThrow();
  });

  it('언마운트하면 턴 루프가 멈춘다', async () => {
    // 회귀: 구독만 끊고 pause하지 않으면 아무도 보지 않는 게임이 계속
    // 돌며 엔진을 호출한다. 측정해보니 300ms 동안 5회가 더 호출됐다.
    // 실제 API 엔진에서는 그대로 네트워크 비용이 된다.
    let calls = 0;
    // 서로 이어지는 단어들. 규칙 위반으로 게임이 조기 종료되면
    // 루프가 계속 도는지 확인할 수 없다.
    const CHAIN = ['과자', '자연', '연필', '필통', '통조림', '림프'];
    const countingEngine = (): Engine => ({
      label: 'Counting',
      generate: async () => {
        const nth = calls;
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { text: CHAIN[nth % CHAIN.length], thinkingTime: 0 };
      },
    });

    const scenario = createWordChain({ openingWord: '사과', maxTurns: 50 });
    const engines = { a: countingEngine(), b: countingEngine() };
    const { result, unmount } = renderHook(() =>
      useMatch({ scenario, agents: AGENTS, engines }),
    );

    act(() => {
      result.current.start();
    });
    // 첫 호출이 실제로 일어날 때까지 기다린다.
    await waitFor(() => {
      expect(calls).toBeGreaterThan(0);
    });

    unmount();
    const atUnmount = calls;
    // 루프가 살아 있으면 10ms짜리 턴이 이 시간 동안 여러 번 더 돈다.
    await new Promise((resolve) => setTimeout(resolve, 300));
    // 진행 중이던 턴 하나는 끝날 수 있지만 루프가 이어지면 안 된다.
    expect(calls).toBeLessThanOrEqual(atUnmount + 1);
  });

  it('진행 중 reset하면 이전 게임의 턴이 새어 들어오지 않는다', async () => {
    // 회귀: step()이 await에서 돌아온 뒤 세대 확인 없이 턴을 방출하면
    // 리셋으로 비운 화면에 버려진 게임의 발화가 하나 얹힌다.
    const slowEngine = (word: string): Engine => ({
      label: 'Slow',
      generate: async () => {
        await new Promise((resolve) => setTimeout(resolve, 60));
        return { text: word, thinkingTime: 0 };
      },
    });

    const scenario = createWordChain({ openingWord: '사과', maxTurns: 50 });
    const engines = { a: slowEngine('과자'), b: slowEngine('자연') };
    const { result } = renderHook(() => useMatch({ scenario, agents: AGENTS, engines }));

    act(() => {
      result.current.start();
    });
    // 첫 턴이 아직 진행 중일 때 리셋한다.
    await new Promise((resolve) => setTimeout(resolve, 20));
    act(() => {
      result.current.reset();
    });
    expect(result.current.turns).toHaveLength(0);

    // 버려진 턴이 뒤늦게 도착하는지 확인한다.
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(result.current.turns).toHaveLength(0);
    expect(result.current.status).toBe('idle');
  });
});
