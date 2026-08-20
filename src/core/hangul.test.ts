import { describe, expect, it } from 'vitest';
import { compose, decompose, isHangulSyllable, isHangulWord, lastChar } from './hangul';

describe('isHangulSyllable', () => {
  it('완성형 음절을 인식한다', () => {
    expect(isHangulSyllable('가')).toBe(true);
    expect(isHangulSyllable('힣')).toBe(true);
    expect(isHangulSyllable('과')).toBe(true);
  });

  it('자모 단독, 영문, 숫자, 공백은 거부한다', () => {
    expect(isHangulSyllable('ㄱ')).toBe(false);
    expect(isHangulSyllable('ㅏ')).toBe(false);
    expect(isHangulSyllable('a')).toBe(false);
    expect(isHangulSyllable('1')).toBe(false);
    expect(isHangulSyllable(' ')).toBe(false);
  });

  it('두 글자 이상은 거부한다', () => {
    expect(isHangulSyllable('가나')).toBe(false);
    expect(isHangulSyllable('')).toBe(false);
  });
});

describe('isHangulWord', () => {
  it('한글로만 된 단어를 통과시킨다', () => {
    expect(isHangulWord('사과')).toBe(true);
    expect(isHangulWord('끝말잇기')).toBe(true);
  });

  it('섞이거나 비어 있으면 거부한다', () => {
    expect(isHangulWord('사과1')).toBe(false);
    expect(isHangulWord('apple')).toBe(false);
    expect(isHangulWord('사 과')).toBe(false);
    expect(isHangulWord('')).toBe(false);
  });
});

describe('decompose', () => {
  it('받침 없는 음절을 분해한다', () => {
    expect(decompose('가')).toEqual({ initial: 'ㄱ', medial: 'ㅏ', final: '' });
  });

  it('받침 있는 음절을 분해한다', () => {
    expect(decompose('강')).toEqual({ initial: 'ㄱ', medial: 'ㅏ', final: 'ㅇ' });
    expect(decompose('닭')).toEqual({ initial: 'ㄷ', medial: 'ㅏ', final: 'ㄺ' });
  });

  it('복합 중성을 분해한다', () => {
    expect(decompose('과')).toEqual({ initial: 'ㄱ', medial: 'ㅘ', final: '' });
  });

  it('한글이 아니면 null', () => {
    expect(decompose('a')).toBeNull();
    expect(decompose('ㄱ')).toBeNull();
  });
});

describe('compose', () => {
  it('분해한 것을 되돌린다', () => {
    for (const char of ['가', '힣', '닭', '과', '쒜']) {
      expect(compose(decompose(char)!)).toBe(char);
    }
  });

  it('알 수 없는 자모는 null', () => {
    expect(compose({ initial: 'ㅏ', medial: 'ㅏ', final: '' })).toBeNull();
  });
});

describe('lastChar', () => {
  it('끝 글자를 반환한다', () => {
    expect(lastChar('사과')).toBe('과');
    expect(lastChar('가')).toBe('가');
    expect(lastChar('')).toBe('');
  });
});
