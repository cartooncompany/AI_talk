# AI_Talk

AI 두 명이 주어진 주제로 자동으로 대화하는 것을 관전하는 웹앱.
첫 종목은 끝말잇기.

## 실행

```bash
npm install
npm run dev
```

## 구조

발화 생성 / 규칙 판정 / 턴 진행 / 화면 표시를 분리한다.
`src/core`는 React에 의존하지 않는 순수 TypeScript이며, 나중에 서버로 옮길 수 있다.

```
src/
  core/
    types.ts       Scenario·Engine·Conductor 사이의 계약
    scenarios/     대화 규칙 (끝말잇기 등)
    engines/       발화 생성기 (Mock, 추후 실제 API)
    conductor.ts   턴 루프 상태 머신
  data/            단어 사전 등 정적 데이터
  ui/              관전 화면
```

엔진은 `Engine` 인터페이스로 교체 가능하다. 현재는 API 키 없이 동작하는
Mock 엔진으로 대화 루프와 UI를 검증하고, 이후 실제 모델 호출을 끼워넣는다.
# AI_talk
