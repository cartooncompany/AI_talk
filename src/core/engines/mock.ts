/**
 * Mock 발화 엔진.
 *
 * API 키 없이 대화 루프와 UI를 검증하기 위한 구현. 사전에서 규칙에 맞는
 * 단어를 고르되, 일정 확률로 일부러 틀린다. 실수가 없으면 게임이 턴 제한까지
 * 가서 승패 판정 경로를 검증할 수 없기 때문이다.
 *
 * 실제 API를 붙일 때는 이 파일을 대체하는 것이 아니라 형제 파일을 추가한다.
 * Conductor는 Engine 인터페이스로만 호출하므로 교체 지점이 한 곳이다.
 */

import { allowedStarts } from '../dueum';
import { firstChar, lastChar } from '../hangul';
import { createRandom, type Random } from '../random';
import type { Engine, EngineContext, EngineResponse } from '../types';
import { WORDS } from '../../data/words';

export interface MockEngineOptions {
  /** 화면에 표시될 이름. 기본 'Mock'. */
  label?: string;
  /** 일부러 틀릴 확률 (0~1). 기본 0.04. 값을 올리면 게임이 빨리 끝난다. */
  mistakeRate?: number;
  /** 응답 지연 범위(ms). 기본 400~1400. */
  delayRange?: [number, number];
  /** 난수 시드. 고정하면 게임이 재현된다. */
  seed?: number;
  /** 지연을 실제로 기다릴지. 테스트에서는 false로 둔다. 기본 true. */
  wait?: boolean;
}

/** 실수의 종류. 각각 Scenario의 다른 판정 경로를 자극한다. */
type MistakeKind = 'wrong-start' | 'repeat' | 'single-char' | 'not-a-word';

const NONSENSE = ['뷁죠', '샬라', '끄앙', '흡퍅', '쀼쀼'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** history에서 이미 쓰인 단어들. */
function usedWords(context: EngineContext): string[] {
  return context.history.filter((turn) => turn.valid).map((turn) => turn.text);
}

/**
 * 이어야 할 글자를 context에서 알아낸다.
 *
 * Engine은 Scenario를 직접 참조하지 않으므로 history에서 유도한다.
 * 유효한 턴이 없으면 instruction에 담긴 시작 글자를 쓸 수 없어 null을 반환하고,
 * 그때는 아무 단어나 고른다 — 판정은 Scenario의 몫이다.
 */
function requiredChar(context: EngineContext): string | null {
  const used = usedWords(context);
  if (used.length > 0) return lastChar(used[used.length - 1]);

  // 첫 턴: instruction에 담긴 '...'(으)로 시작하는 부분에서 글자를 뽑는다.
  const quoted = context.instruction.match(/'([가-힣])'/g);
  if (!quoted || quoted.length === 0) return null;
  return quoted[0].replace(/'/g, '');
}

/** 규칙에 맞는 후보 단어들. */
function validCandidates(context: EngineContext): string[] {
  const need = requiredChar(context);
  if (!need) return [];
  const used = new Set(usedWords(context));
  const starts = new Set(allowedStarts(need));
  return WORDS.filter(
    (word) => starts.has(firstChar(word)) && !used.has(word) && word.length >= 2,
  );
}

/**
 * 후보 중 '상대가 이어받을 수 있는' 것들만 남긴다.
 *
 * 사전이 작아서 아무 단어나 고르면 몇 턴 만에 막다른 길에 닿는다. 실제로
 * 끝말잇기를 두는 사람도 이어갈 수 있는 단어를 고르므로, 이렇게 두는 편이
 * 자연스럽고 관전할 만한 길이가 나온다.
 *
 * 모든 후보가 막다른 길이면 빈 배열 대신 원래 후보를 그대로 쓴다 —
 * 이어갈 수는 있어야 하기 때문이다.
 */
function survivingCandidates(candidates: string[], context: EngineContext): string[] {
  const used = new Set(usedWords(context));
  const openable = candidates.filter((word) => {
    const nextStarts = new Set(allowedStarts(lastChar(word)));
    return WORDS.some(
      (next) =>
        nextStarts.has(firstChar(next)) &&
        next !== word &&
        !used.has(next) &&
        next.length >= 2,
    );
  });
  return openable.length > 0 ? openable : candidates;
}

/** 일부러 틀린 단어를 만든다. */
function makeMistake(kind: MistakeKind, context: EngineContext, random: Random): string {
  const used = usedWords(context);

  switch (kind) {
    case 'repeat':
      // 이미 나온 단어를 다시 말한다.
      return random.pick(used) ?? random.pick(WORDS) ?? '사과';

    case 'single-char': {
      // 규칙엔 맞지만 한 글자.
      const need = requiredChar(context);
      return need ?? '가';
    }

    case 'not-a-word':
      // 사전에 없는 말.
      return random.pick(NONSENSE) ?? '뷁죠';

    case 'wrong-start':
    default: {
      // 엉뚱한 글자로 시작하는 실제 단어.
      const need = requiredChar(context);
      const starts = new Set(need ? allowedStarts(need) : []);
      const wrong = WORDS.filter((word) => !starts.has(firstChar(word)));
      return random.pick(wrong) ?? '바나나';
    }
  }
}

export function createMockEngine(options: MockEngineOptions = {}): Engine {
  const label = options.label ?? 'Mock';
  const mistakeRate = options.mistakeRate ?? 0.04;
  const [minDelay, maxDelay] = options.delayRange ?? [400, 1400];
  const shouldWait = options.wait ?? true;
  const random = createRandom(options.seed);

  return {
    label,

    async generate(context: EngineContext): Promise<EngineResponse> {
      const delay = minDelay + random.int(Math.max(1, maxDelay - minDelay + 1));
      if (shouldWait) await sleep(delay);

      const candidates = validCandidates(context);

      // 후보가 없으면 막다른 길이다. 실제 사람도 이때 아무 말이나 하게 되므로
      // 사전에 없는 말을 내놓고 규칙 위반으로 지는 편이 자연스럽다.
      if (candidates.length === 0) {
        return { text: makeMistake('not-a-word', context, random), thinkingTime: delay };
      }

      if (random.chance(mistakeRate)) {
        const kinds: MistakeKind[] = ['wrong-start', 'not-a-word', 'single-char'];
        // 되풀이 실수는 쓸 단어가 있을 때만 가능하다.
        if (usedWords(context).length > 0) kinds.push('repeat');
        const kind = random.pick(kinds) ?? 'not-a-word';
        return { text: makeMistake(kind, context, random), thinkingTime: delay };
      }

      const word = random.pick(survivingCandidates(candidates, context))!;
      return { text: word, thinkingTime: delay };
    },
  };
}

/** 테스트용. 주어진 단어들을 순서대로 내놓는다. */
export function createScriptedEngine(script: string[], label = 'Scripted'): Engine {
  let cursor = 0;
  return {
    label,
    async generate(): Promise<EngineResponse> {
      const text = script[cursor] ?? '';
      cursor += 1;
      return { text, thinkingTime: 0 };
    },
  };
}
