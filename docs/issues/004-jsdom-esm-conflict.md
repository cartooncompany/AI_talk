# 004. jsdom이 Node 23에서 ESM 충돌로 동작하지 않는 문제

- **발생 단계**: 04 관전 UI
- **날짜**: 2026-08-20
- **상태**: 해결됨 (happy-dom으로 대체)

## 증상

UI 훅 테스트를 위해 jsdom을 도입하자 **기존 65개 테스트가 전부 깨졌다.**

```
Test Files   (5)
     Tests  no tests
    Errors  5 errors

Error: require() of ES Module .../node_modules/@csstools/css-calc/dist/index.mjs
not supported.
 ❯ Object.<anonymous> node_modules/@asamuzakjp/css-color/dist/cjs/index.cjs:30:24
Serialized Error: { code: 'ERR_REQUIRE_ESM' }
```

## 원인

jsdom의 CSS 파서 의존성(`@asamuzakjp/css-color`)이 CommonJS인데, 그것이
`require()`하는 `@csstools/css-calc`는 ESM 전용이다. Node 23에서 이 조합이
`ERR_REQUIRE_ESM`으로 실패한다.

`vitest.config.ts`에 `environment: 'jsdom'`을 전역으로 걸었기 때문에 DOM이
필요 없는 코어 테스트까지 같이 무너졌다.

## 해결

두 단계로 처리했다.

**1. 환경을 전역에서 파일별로 좁혔다.** 코어 로직(`src/core`)은 DOM이 필요
없으므로 기본을 `node`로 두고, UI 훅 테스트만 파일 상단 주석으로 지정한다.

```ts
// vitest.config.ts
test: { environment: 'node' }
```

```tsx
/** @vitest-environment happy-dom */
```

이것만으로 코어 테스트 65개는 즉시 복구됐다.

**2. jsdom을 happy-dom으로 교체했다.** 환경을 좁혀도 UI 테스트 파일 2개에서는
같은 오류가 남았다. happy-dom은 순수 ESM이라 이 충돌이 없고, 훅 테스트에
필요한 DOM API를 충분히 제공한다. jsdom은 제거했다.

## 검증

```
npm test → 77 passed (7 files)
  src/core/*           node 환경
  src/ui/hooks/*.tsx   happy-dom 환경
```

## 참고

이 문제는 프로젝트 코드가 아니라 도구 체인의 조합에서 왔다. Node 버전을
낮추면 우회되지만, [이슈 001](001-node-version-shadowing.md)에서 Node 버전을
고정한 맥락과 충돌하므로 라이브러리를 바꾸는 편이 옳았다.
