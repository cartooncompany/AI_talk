/**
 * 콘솔 데모.
 *
 * UI 없이 게임 한 판을 끝까지 돌린다. 계획안 3단계의 검증 지점.
 *
 *   npm run demo            무작위 시드
 *   npm run demo -- 42      시드 고정 (재현 가능)
 */
import { createConductor } from '../src/core/conductor.ts';
import { createMockEngine } from '../src/core/engines/mock.ts';
import { createWordChain } from '../src/core/scenarios/wordchain.ts';

const seed = process.argv[2] ? Number(process.argv[2]) : Date.now();

const agents = [
  { id: 'claude', name: 'Claude', emoji: '🟠', color: '#c96442' },
  { id: 'gpt', name: 'GPT', emoji: '🟢', color: '#10a37f' },
];

const scenario = createWordChain({ maxTurns: 50 });
const conductor = createConductor({
  scenario,
  agents,
  engines: {
    claude: createMockEngine({ label: 'Mock/Claude', seed, wait: false }),
    gpt: createMockEngine({ label: 'Mock/GPT', seed: seed + 1, wait: false }),
  },
});

const nameOf = (id) => agents.find((a) => a.id === id)?.name ?? id;
const emojiOf = (id) => agents.find((a) => a.id === id)?.emoji ?? '';

conductor.subscribe((event) => {
  if (event.type === 'start') {
    console.log(`\n  시드: ${seed}`);
    console.log(`  종목: ${scenario.name} — ${scenario.description}`);
    console.log(`  시작 단어: 「${event.opening}」\n`);
  }
  if (event.type === 'turn') {
    const { turn } = event;
    const who = `${emojiOf(turn.agentId)} ${nameOf(turn.agentId)}`;
    const mark = turn.valid ? '  ' : ' ✗';
    const note = turn.valid ? '' : `   ← ${turn.reason}`;
    const num = String(turn.index + 1).padStart(2, ' ');
    console.log(`  ${num}.${mark} ${who.padEnd(12)} ${turn.text}${note}`);
  }
  if (event.type === 'finish') {
    console.log(`\n  ${'─'.repeat(56)}`);
    console.log(`  ${event.result.summary}`);
    console.log(`  총 ${conductor.getState().turns.length}턴 · 종료 사유: ${event.result.reason}\n`);
  }
});

await conductor.start();
