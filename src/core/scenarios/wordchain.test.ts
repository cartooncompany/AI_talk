import { describe, expect, it } from 'vitest';
import { createWordChain } from './wordchain';
import type { Agent, Turn } from '../types';

const AGENTS: [Agent, Agent] = [
  { id: 'a', name: '클로드', emoji: '🅰️', color: '#c96442' },
  { id: 'b', name: '지피티', emoji: '🅱️', color: '#10a37f' },
];

/** 유효한 턴들을 만든다. 에이전트는 번갈아 배정된다. */
function turns(...words: string[]): Turn[] {
  return words.map((text, index) => ({
    index,
    agentId: index % 2 === 0 ? 'a' : 'b',
    text,
    valid: true,
    thinkingTime: 0,
  }));
}

describe('judge — 시작 글자', () => {
  const scenario = createWordChain({ openingWord: '사과' });

  it('앞 단어의 끝 글자로 시작하면 통과', () => {
    expect(scenario.judge('과자', [])).toEqual({ valid: true });
  });

  it('다른 글자로 시작하면 거부', () => {
    const result = scenario.judge('바나나', []);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toContain('시작해야');
  });

  it('history가 있으면 마지막 유효 단어를 기준으로 판정한다', () => {
    const history = turns('과자');
    expect(scenario.judge('자연', history)).toEqual({ valid: true });
    expect(scenario.judge('과일', history).valid).toBe(false);
  });
});

describe('judge — 두음법칙', () => {
  it('허용 시 ㄹ → ㄴ 으로 받을 수 있다', () => {
    const scenario = createWordChain({ openingWord: '개나리', allowDueum: true });
    // '리'로 끝나므로 '리'와 두음 변환된 '이' 둘 다 시작 글자로 쓸 수 있다
    expect(scenario.judge('이불', []).valid).toBe(true);
    expect(scenario.judge('리본', []).valid).toBe(true);
  });

  it('비허용 시 원래 글자로만 받을 수 있다', () => {
    const scenario = createWordChain({ openingWord: '개나리', allowDueum: false });
    expect(scenario.judge('이불', []).valid).toBe(false);
  });
});

describe('judge — 중복', () => {
  const scenario = createWordChain({ openingWord: '사과' });

  it('이미 나온 단어는 거부', () => {
    const history = turns('과자', '자연');
    const result = scenario.judge('과자', history);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toContain('이미 나온');
  });

  it('시작 단어도 중복으로 친다', () => {
    const s = createWordChain({ openingWord: '과자' });
    const history = turns('자연', '연필');
    expect(s.judge('과자', history).valid).toBe(false);
  });
});

describe('judge — 형식', () => {
  const scenario = createWordChain({ openingWord: '사과' });

  it('한 글자 단어는 거부', () => {
    const result = scenario.judge('과', []);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toContain('한 글자');
  });

  it('한글이 아니면 거부', () => {
    expect(scenario.judge('apple', []).valid).toBe(false);
    expect(scenario.judge('과일2', []).valid).toBe(false);
    expect(scenario.judge('과 일', []).valid).toBe(false);
  });

  it('빈 문자열은 거부', () => {
    expect(scenario.judge('', []).valid).toBe(false);
    expect(scenario.judge('   ', []).valid).toBe(false);
  });

  it('앞뒤 공백은 무시한다', () => {
    expect(scenario.judge('  과자  ', []).valid).toBe(true);
  });
});

describe('judge — 사전', () => {
  const scenario = createWordChain({ openingWord: '사과' });

  it('사전에 없으면 거부', () => {
    const result = scenario.judge('과뷁', []);
    expect(result.valid).toBe(false);
    expect(result.valid === false && result.reason).toContain('사전');
  });
});

describe('checkCompletion', () => {
  const scenario = createWordChain({ openingWord: '사과', maxTurns: 6 });

  it('진행 중이면 null', () => {
    expect(scenario.checkCompletion(turns('과자'), AGENTS)).toBeNull();
  });

  it('규칙 위반 시 상대가 승리', () => {
    const history: Turn[] = [
      ...turns('과자'),
      { index: 1, agentId: 'b', text: '바나나', valid: false, reason: '틀림', thinkingTime: 0 },
    ];
    const result = scenario.checkCompletion(history, AGENTS)!;
    expect(result.reason).toBe('rule-violation');
    expect(result.winnerId).toBe('a');
    expect(result.summary).toContain('지피티');
  });

  it('턴 제한 도달 시 무승부', () => {
    const history = turns('과자', '자연', '연필', '필통', '통조림', '림프');
    const result = scenario.checkCompletion(history, AGENTS)!;
    expect(result.reason).toBe('turn-limit');
    expect(result.winnerId).toBeNull();
  });
});

describe('instructionFor', () => {
  const scenario = createWordChain({ openingWord: '사과' });

  it('이어야 할 글자를 알려준다', () => {
    expect(scenario.instructionFor([])).toContain('과');
  });

  it('두음법칙 대안을 함께 알려준다', () => {
    const s = createWordChain({ openingWord: '개나리' });
    const instruction = s.instructionFor([]);
    expect(instruction).toContain('리');
    expect(instruction).toContain('이');
  });

  it('이미 나온 단어를 알려준다', () => {
    const instruction = scenario.instructionFor(turns('과자', '자연'));
    expect(instruction).toContain('과자');
    expect(instruction).toContain('자연');
  });
});
