/** @vitest-environment happy-dom */
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMatch } from './useMatch';
import { createScriptedEngine } from '../../core/engines/mock';
import { createWordChain } from '../../core/scenarios/wordchain';
import type { Agent } from '../../core/types';

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
});
