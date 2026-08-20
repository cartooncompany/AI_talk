# 작업 문서

프로젝트 진행 기록을 남기는 곳.

## 구조

```
docs/
  work/     작업 로그 — 단계별로 무엇을 왜 했는지
  issues/   이슈 기록 — 문제가 생겼을 때 원인과 해결
```

## 규칙

**작업 로그** (`docs/work/`)
- 계획안의 단계 하나가 끝날 때마다 파일 하나.
- 파일명: `NN-단계이름.md` (예: `01-setup.md`)
- 담는 것: 무엇을 했는지, 왜 그렇게 했는지, 결과 검증, 다음 단계.

**이슈** (`docs/issues/`)
- 예상과 다르게 동작하거나 막힌 지점이 생기면 그때 파일 하나.
- 파일명: `NNN-짧은-제목.md` (예: `001-node-version-shadowing.md`)
- 담는 것: 증상, 원인, 해결, 재발 방지.
- 해결되지 않은 채로 넘어가는 것도 기록한다. 상태를 명시할 것.

## 워크플로우

Git 브랜치·커밋·PR 규칙은 [workflow.md](workflow.md) 참고.

## 색인

### 작업 로그
- [01. 프로젝트 셋업](work/01-setup.md)
- [02. 끝말잇기 규칙 엔진](work/02-wordchain-scenario.md)
- [03. Mock 엔진 + Conductor](work/03-mock-engine-conductor.md)

### 이슈
- [001. npm 스크립트에서 Node 버전이 가려지는 문제](issues/001-node-version-shadowing.md) — 해결됨
- [002. 게임이 너무 빨리 끝나는 문제](issues/002-short-games.md) — 완화됨
