/** @vitest-environment happy-dom */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useTypewriter } from './useTypewriter';

describe('useTypewriter', () => {
  it('enabled가 false면 즉시 전체를 보여준다', () => {
    const { result } = renderHook(() => useTypewriter('사과', { enabled: false }));
    expect(result.current.shown).toBe('사과');
    expect(result.current.done).toBe(true);
  });

  it('빈 문자열도 done으로 처리한다', () => {
    const { result } = renderHook(() => useTypewriter('', { enabled: true }));
    expect(result.current.done).toBe(true);
  });

  it('활성화하면 점진적으로 나타나 결국 전체가 된다', async () => {
    const { result } = renderHook(() =>
      useTypewriter('끝말잇기', { enabled: true, speed: 5 }),
    );
    await waitFor(() => expect(result.current.done).toBe(true));
    expect(result.current.shown).toBe('끝말잇기');
  });

  it('텍스트가 바뀌면 새로 타이핑한다', async () => {
    const { result, rerender } = renderHook(
      ({ text }) => useTypewriter(text, { enabled: true, speed: 5 }),
      { initialProps: { text: '사과' } },
    );
    await waitFor(() => expect(result.current.done).toBe(true));
    rerender({ text: '바나나' });
    await waitFor(() => expect(result.current.shown).toBe('바나나'));
  });
});
