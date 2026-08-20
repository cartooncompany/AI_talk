/**
 * 시드 기반 난수 생성기.
 *
 * Mock 엔진이 단어를 고르고 실수를 낼 확률을 다룰 때 쓴다. 시드를 고정하면
 * 같은 게임이 그대로 재현되므로 테스트가 안정적이고, 버그 재현도 쉽다.
 *
 * mulberry32 — 32비트 상태의 작고 빠른 PRNG. 암호학적 용도가 아니며
 * 게임 진행에 쓰기에 충분한 품질이다.
 */
export interface Random {
  /** [0, 1) 구간의 실수. */
  next(): number;
  /** [0, max) 구간의 정수. */
  int(max: number): number;
  /** 배열에서 하나를 고른다. 빈 배열이면 undefined. */
  pick<T>(items: readonly T[]): T | undefined;
  /** 주어진 확률(0~1)로 true. */
  chance(probability: number): boolean;
}

export function createRandom(seed = Date.now()): Random {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // 시드 직후 첫 출력이 시드값에 강하게 좌우되는 성질이 있어, 상태를 몇 번
  // 돌려 흩뜨린 뒤 사용한다. 이렇게 하지 않으면 인접한 시드끼리 초반 난수가
  // 비슷해져서, 게임이 첫 턴부터 같은 방식으로 끝나는 일이 잦다.
  for (let i = 0; i < 8; i += 1) next();

  return {
    next,
    int: (max: number) => Math.floor(next() * max),
    pick: <T,>(items: readonly T[]) =>
      items.length === 0 ? undefined : items[Math.floor(next() * items.length)],
    chance: (probability: number) => next() < probability,
  };
}
