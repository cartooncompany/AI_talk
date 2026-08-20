# Git 워크플로우

작업 단계마다 아래 순서를 자동으로 진행한다.

## 리포지토리

- **원격**: https://github.com/cartooncompany/AI_talk
- **기본 브랜치**: `main`
- **공개 범위**: public — 커밋하는 모든 코드와 문서가 공개된다. API 키·토큰이
  섞여 들어가지 않도록 주의할 것. `.env` 계열은 `.gitignore`로 차단되어 있다.

## 단계별 순서

```
1. 이슈 생성      단계 목표와 작업 항목을 체크리스트로
2. 브랜치 생성    main에서 분기
3. 작업 + 커밋    의미 단위로 나눠서
4. 문서 작성      docs/work/NN-*.md, 이슈 발생 시 docs/issues/NNN-*.md
5. PR 생성        본문에 Closes #N 으로 이슈 연결
6. 검증           tsc / lint / build 통과 확인
7. Squash 머지    머지 후 브랜치 삭제, 이슈 자동 종료
8. main 동기화    로컬 main을 pull
```

## 브랜치 이름

| 종류 | 형식 | 예시 |
|---|---|---|
| 기능 | `feat/NN-이름` | `feat/02-wordchain-scenario` |
| 버그 수정 | `fix/NNN-이름` | `fix/002-turn-limit` |
| 문서 | `docs/이름` | `docs/workflow` |
| 설정·빌드 | `chore/이름` | `chore/vitest-setup` |

## 커밋 메시지

Conventional Commits를 따르되 본문은 한국어로 쓴다.

```
feat: 끝말잇기 규칙 엔진 구현

Scenario 인터페이스를 구현한다. 두음법칙은 옵션으로 처리했다.

- 끝 글자 잇기 판정
- 중복 단어 검사
- 한 글자 단어 거부

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

접두사: `feat` / `fix` / `docs` / `chore` / `refactor` / `test`

## 머지 방식

**Squash merge**를 쓴다. 단계 하나가 `main`에서 커밋 하나로 남아 히스토리가
계획안의 단계와 1:1로 대응된다. 머지 후 작업 브랜치는 삭제한다.

## 이슈 기록

`docs/issues/`의 이슈 문서는 GitHub 이슈와 별개다.

- **GitHub 이슈** — 단계별 작업 항목 추적. 계획된 일.
- **`docs/issues/`** — 예상 밖의 문제와 그 원인·해결 기록. 계획되지 않은 일.

작업 중 문제가 생기면 `docs/issues/`에 기록하고, 해당 단계의 PR에 함께 담는다.
