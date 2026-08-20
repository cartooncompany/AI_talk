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
5. 검증           test / lint / build 통과 확인
6. 코드 리뷰      중요 단계에 한해 (아래 참고)
7. PR 생성        본문에 Closes #N 으로 이슈 연결
8. Squash 머지    머지 후 브랜치 삭제, 이슈 자동 종료
9. main 동기화    로컬 main을 pull
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

## 코드 리뷰

**모든 단계에 리뷰를 돌리지 않는다.** 코드를 쓴 주체와 리뷰하는 주체가 같으면
같은 판단이 두 번 들어갈 뿐이라 놓친 것을 잡아주지 못한다. 리뷰의 가치는
다른 관점에서 나온다.

대신 테스트가 약한 영역에 한해 `/code-review`를 돌린다. 이 명령은 별도
컨텍스트에서 실행되므로, 코드를 작성하며 형성된 확신을 공유하지 않는다.

| 단계 | 리뷰 | 이유 |
|---|---|---|
| 코어 로직 (Scenario, Engine, Conductor) | 생략 | 순수 함수라 테스트로 검증된다 |
| **UI 도입** | `/code-review` | 상태 관리·렌더링은 단위 테스트가 약하다 |
| **실제 API 연동** | `/code-review high` | 키 노출, 에러 처리, 비용 제어. public 리포라 특히 중요 |
| 리팩터링으로 코어 구조가 바뀔 때 | `/code-review` | 테스트가 통과해도 설계가 어긋날 수 있다 |

리뷰를 돌린 단계는 PR 본문에 결과를 요약해 남긴다.

`/code-review ultra`(멀티 에이전트 클라우드 리뷰)는 사용자가 직접 실행해야 하며
과금된다. 자동 플로우에서는 쓰지 않는다.

## 머지 방식

**Squash merge**를 쓴다. 단계 하나가 `main`에서 커밋 하나로 남아 히스토리가
계획안의 단계와 1:1로 대응된다. 머지 후 작업 브랜치는 삭제한다.

## 이슈 기록

`docs/issues/`의 이슈 문서는 GitHub 이슈와 별개다.

- **GitHub 이슈** — 단계별 작업 항목 추적. 계획된 일.
- **`docs/issues/`** — 예상 밖의 문제와 그 원인·해결 기록. 계획되지 않은 일.

작업 중 문제가 생기면 `docs/issues/`에 기록하고, 해당 단계의 PR에 함께 담는다.
