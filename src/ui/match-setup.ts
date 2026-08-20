/**
 * 대전 구성.
 *
 * 지금은 Mock 엔진 두 개가 붙는다. 실제 API를 연동하는 단계에서
 * engines만 바꾸면 되도록 이 파일에 모아뒀다.
 */

import { createMockEngine } from '../core/engines/mock';
import { createRandom } from '../core/random';
import { createWordChain, pickOpeningWord } from '../core/scenarios/wordchain';
import type { Agent, Engine } from '../core/types';

export const AGENTS: [Agent, Agent] = [
  { id: 'claude', name: 'Claude', emoji: '🟠', color: '#c96442' },
  { id: 'gpt', name: 'GPT', emoji: '🟢', color: '#10a37f' },
];

/**
 * 관전 속도.
 *
 * 턴 사이 간격만 줄이면 Mock 엔진 자체의 '생각하는 시간'이 남아 빠른 쪽의
 * 체감 차이가 묻힌다. 엔진 지연도 함께 배율을 적용해 라벨대로 느껴지게 한다.
 */
export const SPEEDS = [
  { label: '0.5x', turnDelay: 1600, thinkRange: [800, 2800] },
  { label: '1x', turnDelay: 800, thinkRange: [400, 1400] },
  { label: '2x', turnDelay: 400, thinkRange: [200, 700] },
  { label: '4x', turnDelay: 200, thinkRange: [100, 350] },
] as const;

/** 두 시드가 이웃하지 않도록 벌리는 값 (황금비 기반 상수). */
const SEED_GAP = 0x9e3779b9;

export function createMatch(seed = Date.now(), speedIndex = 1) {
  // 시드를 흩뜨려 인접한 라운드끼리 게임이 닮지 않게 한다.
  const base = Math.imul(seed ^ 0x5bf03635, 0x27d4eb2f) >>> 0;
  const random = createRandom(base);

  // 시작 단어도 시드에서 뽑는다. 이것 없이는 같은 시드로도 다른 게임이 된다.
  const scenario = createWordChain({
    maxTurns: 50,
    openingWord: pickOpeningWord(random),
  });

  const delayRange = SPEEDS[speedIndex].thinkRange as unknown as [number, number];
  const engines: Record<string, Engine> = {
    claude: createMockEngine({ label: 'Mock/Claude', seed: base, delayRange }),
    gpt: createMockEngine({
      label: 'Mock/GPT',
      seed: (base + SEED_GAP) >>> 0,
      delayRange,
    }),
  };
  return { scenario, engines };
}
