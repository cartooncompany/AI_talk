# 01. 프로젝트 셋업

- **날짜**: 2026-08-20
- **상태**: 완료

## 목표

빈 디렉토리에서 시작해, 이후 단계에서 코어 로직을 얹을 수 있는 뼈대를 만든다.

## 한 일

### 1. Vite + React + TypeScript 스캐폴딩

```bash
npm create vite@latest . -- --template react-ts
npm install
```

React 19.2 / Vite 8.2 / TypeScript 6.0 조합으로 잡혔다. 린터는 템플릿이 기본
제공한 oxlint를 그대로 쓴다.

### 2. 디렉토리 구조

계획안의 "발화 생성 / 규칙 판정 / 턴 진행 / 화면 표시 분리" 원칙을 디렉토리로 표현했다.

```
src/
  core/            React에 의존하지 않는 순수 TypeScript
    types.ts       Scenario·Engine·Conductor 사이의 계약
    scenarios/     대화 규칙 (끝말잇기 등)
    engines/       발화 생성기 (Mock, 추후 실제 API)
  data/            단어 사전 등 정적 데이터
  ui/
    components/
    hooks/
scripts/           빌드 보조 스크립트
docs/              작업 로그와 이슈 기록
```

`core`를 React와 분리한 이유는 두 가지다. 나중에 실제 API를 붙일 때 서버로
그대로 옮길 수 있고, UI 없이 콘솔에서 게임 한 판을 돌려 검증할 수 있다.

### 3. 코어 타입 정의 (`src/core/types.ts`)

이번 단계의 실질적인 산출물. 이 파일이 모듈 간 계약을 확정하므로 먼저 잡았다.

| 타입 | 역할 |
|---|---|
| `Agent` | 대화 참여자 한 명 (이름, 이모지, 테마색) |
| `Turn` | 한 턴의 발화 + 판정 결과 + 응답 시간 |
| `MatchState` | 대화 전체 상태 |
| `MatchResult` | 종료 결과 (사유, 승자) |
| `Engine` | 발화 생성기 인터페이스 — `generate(context)` |
| `Scenario` | 규칙 인터페이스 — `judge`, `instructionFor`, `checkCompletion` |

핵심은 `Engine`과 `Scenario`가 인터페이스라는 점이다. Conductor는 구현을
모른 채 이 인터페이스로만 호출하므로, `MockEngine` → `ClaudeEngine` 교체가
파일 추가만으로 끝난다.

`Scenario`는 상태를 갖지 않고 판정에 필요한 정보를 전부 `history`로 받는다.
판정 로직이 순수 함수가 되어 테스트하기 쉽다.

안전장치로 `maxTurns`를 인터페이스에 넣었다. 게임이 안 끝나는 상황을
처음부터 막기 위함이다.

### 4. 정리 및 설정

- 스캐폴딩 잔여물(`App.css`, 로고 에셋 등) 제거
- `index.html`: 언어 `ko`, 타이틀 `AI_Talk`
- `src/index.css`: 다크 테마 기본 변수, 한글 폰트 스택
- `README.md`: 실행 방법과 구조 설명

## 검증

```
npx tsc --noEmit    → 통과
npm run lint        → 통과
npm run build       → 통과 (dist 생성)
npm run dev         → HTTP 200 확인
```

## 발생한 이슈

- [001. npm 스크립트에서 Node 버전이 가려지는 문제](../issues/001-node-version-shadowing.md) — 해결됨

  홈 디렉토리에 설치된 `node` npm 패키지(v20.18.0)가 PATH에서 셸의 v23을 가려
  Vite 8의 요구 버전에 미달했다. `scripts/run.mjs`로 해당 PATH 항목을 제거해 해결.

## 다음 단계

**02. 끝말잇기 규칙 엔진** — `src/core/scenarios/wordchain.ts`

`Scenario` 인터페이스를 구현한다. 순수 함수이므로 UI 없이 검증 가능하다.

- 끝 글자 잇기 판정 (두음법칙 옵션 포함)
- 중복 단어 검사
- 한 글자 단어 거부
- 사전 등재 여부 확인
