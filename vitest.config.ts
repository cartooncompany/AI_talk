import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // 코어 로직(src/core)은 DOM이 필요 없으므로 기본은 node로 둔다.
    // UI 훅 테스트만 파일 상단의 @vitest-environment 주석으로 happy-dom을 쓴다.
    environment: 'node',
  },
});
