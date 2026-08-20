# 003. 진행 중 속도를 바꾸면 게임이 리셋되는 문제

- **발생 단계**: 04 관전 UI
- **날짜**: 2026-08-20
- **상태**: 해결됨

## 증상

관전 중 속도 셀렉트를 바꾸면 진행하던 대화가 전부 사라지고 게임이
처음 상태(`idle`)로 돌아갔다.

```
속도 변경 전: 2 턴 / 시작단어 담배
속도 변경 후: 0 턴 / 시작단어 담배
버튼: [ '▶ 시작', '↺ 리셋' ]   ← 시작 버튼으로 되돌아감
```

"좀 더 빨리 보고 싶다"며 속도를 올리는 것은 관전자의 자연스러운 행동인데,
그때마다 보던 대화가 사라지므로 치명적이었다.

## 발견 경위

브라우저 자동화로 컨트롤 흐름을 검증하다 발견했다. 처음에는 "재개 후 게임이
진행되지 않는다"는 증상으로 보였는데, 재개만 따로 떼어 확인하니 정상이었다.
테스트 스크립트가 재개 직후 속도를 바꾸고 있었고, 실제 원인은 그쪽이었다.

단위 테스트로는 잡히지 않았다. 속도를 바꾸는 시나리오가 없었기 때문이다.

## 원인

`useMatch`가 `turnDelay`를 `useMemo` 의존성에 두고 있었다.

```ts
const conductor = useMemo(
  () => createConductor({ scenario, agents, engines, turnDelay }),
  [scenario, agents, engines, turnDelay],  // ← turnDelay가 바뀌면 재생성
);
```

속도가 바뀌면 Conductor가 새로 만들어지고, 진행 중이던 게임 상태가 통째로
버려졌다.

## 해결

**속도는 게임의 정체성이 아니라 재생 설정**이다. Conductor를 다시 만들 이유가
없다. `turnDelay`가 함수도 받을 수 있게 하고, Conductor가 매 턴 현재 값을
읽도록 했다.

```ts
// conductor.ts
turnDelay?: number | (() => number);

const readTurnDelay = (): number => {
  const value = options.turnDelay ?? 0;
  return typeof value === 'function' ? value() : value;
};
```

```ts
// useMatch.ts — ref에 담아 두고 게터를 넘긴다
const turnDelayRef = useRef(turnDelay);
useEffect(() => { turnDelayRef.current = turnDelay; }, [turnDelay]);

const conductor = useMemo(
  () => createConductor({ ..., turnDelay: () => turnDelayRef.current }),
  [scenario, agents, engines],   // turnDelay 없음
);
```

## 검증

```
속도 변경 전: 2 턴 / 시작단어 서울
속도 변경 후: 2 턴 / 시작단어 서울
버튼: [ '⏸ 일시정지', '↺ 리셋' ]   ← 진행 유지
```

회귀 테스트를 추가했다 (`useMatch.test.tsx` — "진행 중에 속도를 바꿔도
게임이 리셋되지 않는다").

## 부수적으로 처리한 것

린터(`react/refs`)가 `() => turnDelayRef.current`를 렌더 중 ref 접근으로
오인해 경고했다. 이 콜백은 렌더가 아니라 Conductor의 턴 루프에서 실행된다.
`useCallback`으로 감싸거나 가변 객체로 바꾸는 방법을 시도했으나 각각 다른
경고를 불렀다. 구조가 옳다고 판단해 `.oxlintrc.json`에서 이 파일에 한해
규칙을 껐다.

## 교훈

**단위 테스트만으로는 UI 상호작용 버그를 잡지 못한다.** 이 버그는 브라우저에서
실제로 컨트롤을 조작해봐야 드러났다. 리뷰 정책에서 UI 단계를 `/code-review`
대상으로 잡은 판단이 맞았고, 여기에 더해 브라우저 검증도 UI 단계의 기본
절차로 삼는 것이 좋겠다.
