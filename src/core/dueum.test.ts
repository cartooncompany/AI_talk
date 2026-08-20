import { describe, expect, it } from 'vitest';
import { allowedStarts, applyDueum } from './dueum';

describe('applyDueum', () => {
  it('ㄹ + 일반 모음 → ㄴ', () => {
    expect(applyDueum('락')).toBe('낙');
    expect(applyDueum('로')).toBe('노');
    expect(applyDueum('루')).toBe('누');
  });

  it('ㄹ + ㅑㅕㅛㅠㅣㅐㅖ → ㅇ', () => {
    expect(applyDueum('려')).toBe('여');
    expect(applyDueum('리')).toBe('이');
    expect(applyDueum('료')).toBe('요');
    expect(applyDueum('례')).toBe('예');
  });

  it('ㄴ + ㅑㅕㅛㅠㅣ → ㅇ', () => {
    expect(applyDueum('녀')).toBe('여');
    expect(applyDueum('니')).toBe('이');
  });

  it('ㄴ + 일반 모음은 바뀌지 않는다', () => {
    expect(applyDueum('나')).toBeNull();
    expect(applyDueum('노')).toBeNull();
  });

  it('ㄹㄴ 외 초성은 바뀌지 않는다', () => {
    expect(applyDueum('가')).toBeNull();
    expect(applyDueum('사')).toBeNull();
  });

  it('받침은 유지된다', () => {
    expect(applyDueum('력')).toBe('역');
    expect(applyDueum('론')).toBe('논');
  });

  it('한글이 아니면 null', () => {
    expect(applyDueum('a')).toBeNull();
  });
});

describe('allowedStarts', () => {
  it('원래 글자를 항상 포함한다', () => {
    expect(allowedStarts('가')).toEqual(['가']);
  });

  it('ㄹ → ㄴ 변환을 포함한다', () => {
    expect(allowedStarts('락')).toEqual(['락', '낙']);
  });

  it('ㄹ → ㅇ 변환을 포함한다', () => {
    expect(allowedStarts('려')).toEqual(['려', '여']);
  });

  it('ㄴ → ㅇ 변환을 포함한다', () => {
    expect(allowedStarts('녀')).toEqual(['녀', '여']);
  });

  it('중복 없이 반환한다', () => {
    const starts = allowedStarts('리');
    expect(new Set(starts).size).toBe(starts.length);
  });
});
