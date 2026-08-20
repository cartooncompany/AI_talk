import { describe, expect, it } from 'vitest';
import { createMockEngine, createScriptedEngine } from './mock';
import { createWordChain } from '../scenarios/wordchain';
import type { Agent, EngineContext, Turn } from '../types';

const SELF: Agent = { id: 'a', name: '에이', emoji: '🅰️', color: '#000' };
const OPPONENT: Agent = { id: 'b', name: '비이', emoji: '🅱️', color: '#fff' };

function contextFor(openingWord: string, words: string[] = []): EngineContext {
  const scenario = createWordChain({ openingWord });
  const history: Turn[] = words.map((text, index) => ({
    index,
    agentId: index % 2 === 0 ? 'a' : 'b',
    text,
    valid: true,
    thinkingTime: 0,
  }));
  return {
    self: SELF,
    opponent: OPPONENT,
    history,
    instruction: scenario.instructionFor(history),
  };
}

describe('createMockEngine', () => {
  it('실수하지 않도록 하면 규칙에 맞는 단어를 낸다', async () => {
    const scenario = createWordChain({ openingWord: '사과' });
    const engine = createMockEngine({ mistakeRate: 0, wait: false, seed: 1 });
    const context = contextFor('사과');
    const { text } = await engine.generate(context);
    expect(scenario.judge(text, []).valid).toBe(true);
  });

  it('여러 시드에서 모두 규칙에 맞는 단어를 낸다', async () => {
    const scenario = createWordChain({ openingWord: '사과' });
    for (let seed = 0; seed < 30; seed += 1) {
      const engine = createMockEngine({ mistakeRate: 0, wait: false, seed });
      const { text } = await engine.generate(contextFor('사과'));
      expect(scenario.judge(text, []).valid, `seed ${seed}: ${text}`).toBe(true);
    }
  });

  it('실수율 1이면 규칙을 어긴다', async () => {
    const scenario = createWordChain({ openingWord: '사과' });
    const engine = createMockEngine({ mistakeRate: 1, wait: false, seed: 3 });
    const { text } = await engine.generate(contextFor('사과'));
    expect(scenario.judge(text, []).valid).toBe(false);
  });

  it('같은 시드는 같은 결과를 낸다', async () => {
    const run = async () => {
      const engine = createMockEngine({ wait: false, seed: 777 });
      return (await engine.generate(contextFor('사과'))).text;
    };
    expect(await run()).toBe(await run());
  });

  it('이미 나온 단어를 피한다', async () => {
    const engine = createMockEngine({ mistakeRate: 0, wait: false, seed: 5 });
    const used = ['과자', '과일'];
    const { text } = await engine.generate(contextFor('사과', used));
    expect(used).not.toContain(text);
  });

  it('thinkingTime을 함께 반환한다', async () => {
    const engine = createMockEngine({ wait: false, seed: 9, delayRange: [100, 200] });
    const { thinkingTime } = await engine.generate(contextFor('사과'));
    expect(thinkingTime).toBeGreaterThanOrEqual(100);
    expect(thinkingTime).toBeLessThanOrEqual(200);
  });

  it('label을 지정할 수 있다', () => {
    expect(createMockEngine({ label: 'Mock/Claude' }).label).toBe('Mock/Claude');
  });
});

describe('createScriptedEngine', () => {
  it('주어진 순서대로 발화한다', async () => {
    const engine = createScriptedEngine(['하나', '둘']);
    expect((await engine.generate(contextFor('사과'))).text).toBe('하나');
    expect((await engine.generate(contextFor('사과'))).text).toBe('둘');
  });

  it('대본이 끝나면 빈 문자열을 낸다', async () => {
    const engine = createScriptedEngine(['하나']);
    await engine.generate(contextFor('사과'));
    expect((await engine.generate(contextFor('사과'))).text).toBe('');
  });
});
