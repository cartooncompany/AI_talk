/**
 * 대전 구성.
 *
 * 지금은 Mock 엔진 두 개가 붙는다. 실제 API를 연동하는 단계에서
 * engines만 바꾸면 되도록 이 파일에 모아뒀다.
 */

import { createMockEngine } from '../core/engines/mock';
import { createWordChain } from '../core/scenarios/wordchain';
import type { Agent, Engine } from '../core/types';

export const AGENTS: [Agent, Agent] = [
  { id: 'claude', name: 'Claude', emoji: '🟠', color: '#c96442' },
  { id: 'gpt', name: 'GPT', emoji: '🟢', color: '#10a37f' },
];

/** 관전 속도. 턴 사이 간격(ms). */
export const SPEEDS = [
  { label: '0.5x', turnDelay: 1600 },
  { label: '1x', turnDelay: 800 },
  { label: '2x', turnDelay: 300 },
  { label: '4x', turnDelay: 0 },
] as const;

export function createMatch(seed = Date.now()) {
  const scenario = createWordChain({ maxTurns: 50 });
  const engines: Record<string, Engine> = {
    claude: createMockEngine({ label: 'Mock/Claude', seed }),
    gpt: createMockEngine({ label: 'Mock/GPT', seed: seed + 1 }),
  };
  return { scenario, engines };
}
