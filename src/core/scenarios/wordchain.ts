/**
 * 끝말잇기 Scenario.
 *
 * 상태를 갖지 않는다. 판정에 필요한 정보는 전부 history로 받으므로
 * 각 함수는 순수 함수이고 UI 없이 테스트할 수 있다.
 */

import { allowedStarts } from '../dueum';
import { firstChar, isHangulWord, lastChar } from '../hangul';
import type { Judgement, MatchResult, Scenario, Turn } from '../types';
import { WORDS, WORD_SET } from '../../data/words';

export interface WordChainOptions {
  /** 두음법칙 허용 여부. 예: "락"을 "낙"으로 받을 수 있는지. 기본 true. */
  allowDueum?: boolean;
  /** 안전장치. 이 턴 수에 도달하면 무승부로 끝낸다. 기본 50. */
  maxTurns?: number;
  /** 게임을 여는 첫 단어. 생략하면 사전에서 무작위로 고른다. */
  openingWord?: string;
}

/** history에서 실제로 쓰인 단어들만 뽑는다. 무효 발화는 게임을 끝내므로 제외한다. */
function usedWords(history: Turn[]): string[] {
  return history.filter((turn) => turn.valid).map((turn) => turn.text);
}

/** 다음 단어가 시작해야 할 글자. 아직 아무 단어도 없으면 null. */
function requiredStart(history: Turn[], openingWord: string): string {
  const used = usedWords(history);
  const previous = used.length > 0 ? used[used.length - 1] : openingWord;
  return lastChar(previous);
}

/** 사전에서 무작위로 시작 단어를 고른다. 이어갈 수 있는 단어를 우선한다. */
function pickOpeningWord(): string {
  const starts = new Set(WORDS.map(firstChar));
  const openable = WORDS.filter((word) =>
    allowedStarts(lastChar(word)).some((char) => starts.has(char)),
  );
  const pool = openable.length > 0 ? openable : WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function createWordChain(options: WordChainOptions = {}): Scenario {
  const allowDueum = options.allowDueum ?? true;
  const maxTurns = options.maxTurns ?? 50;
  const openingWord = options.openingWord ?? pickOpeningWord();

  /** 주어진 글자를 이어받을 때 쓸 수 있는 시작 글자들. */
  const startsFor = (char: string): string[] =>
    allowDueum ? allowedStarts(char) : [char];

  return {
    id: 'wordchain',
    name: '끝말잇기',
    description: '앞 단어의 끝 글자로 시작하는 단어를 번갈아 말한다.',
    openingText: openingWord,
    maxTurns,

    instructionFor(history) {
      const need = requiredStart(history, openingWord);
      const candidates = startsFor(need);
      const startHint =
        candidates.length > 1
          ? `${candidates.map((c) => `'${c}'`).join(' 또는 ')}(으)로 시작하는`
          : `'${need}'(으)로 시작하는`;
      const used = usedWords(history);
      const usedHint =
        used.length > 0 ? ` 이미 나온 단어는 쓸 수 없다: ${used.join(', ')}.` : '';
      return `${startHint} 두 글자 이상의 한국어 명사를 하나만 답하라.${usedHint}`;
    },

    judge(text, history): Judgement {
      const word = text.trim();

      if (word.length === 0) {
        return { valid: false, reason: '아무 말도 하지 않았다' };
      }
      if (!isHangulWord(word)) {
        return { valid: false, reason: '한글 단어가 아니다' };
      }
      if (word.length < 2) {
        return { valid: false, reason: '한 글자 단어는 쓸 수 없다' };
      }

      const used = usedWords(history);
      if (used.includes(word) || word === openingWord) {
        return { valid: false, reason: '이미 나온 단어다' };
      }

      const need = requiredStart(history, openingWord);
      const candidates = startsFor(need);
      if (!candidates.includes(firstChar(word))) {
        const expected = candidates.map((c) => `'${c}'`).join(' 또는 ');
        return {
          valid: false,
          reason: `${expected}(으)로 시작해야 하는데 '${firstChar(word)}'로 시작했다`,
        };
      }

      if (!WORD_SET.has(word)) {
        return { valid: false, reason: '사전에 없는 단어다' };
      }

      return { valid: true };
    },

    checkCompletion(history, agents): MatchResult | null {
      const last = history[history.length - 1];

      // 규칙 위반 → 위반한 쪽이 패배.
      if (last && !last.valid) {
        const loser = agents.find((agent) => agent.id === last.agentId);
        const winner = agents.find((agent) => agent.id !== last.agentId);
        return {
          reason: 'rule-violation',
          winnerId: winner?.id ?? null,
          summary: `${loser?.name ?? '?'}의 '${last.text}' — ${last.reason}. ${
            winner?.name ?? '?'
          } 승리.`,
        };
      }

      // 턴 제한 도달 → 무승부.
      if (history.length >= maxTurns) {
        return {
          reason: 'turn-limit',
          winnerId: null,
          summary: `${maxTurns}턴에 도달했다. 무승부.`,
        };
      }

      return null;
    },
  };
}
