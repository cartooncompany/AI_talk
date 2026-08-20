# 001. npm 스크립트에서 Node 버전이 가려지는 문제

- **발생 단계**: 01 프로젝트 셋업
- **날짜**: 2026-08-20
- **상태**: 해결됨

## 증상

`npm run build`, `npm run dev` 실행 시 경고가 떴다.

```
You are using Node.js 20.18.0. Vite requires Node.js version 20.19+ or 22.12+.
Please upgrade your Node.js version.
```

빌드와 dev 서버 자체는 동작했지만(HTTP 200 확인), 요구 버전에 미달한 상태라
언제든 깨질 수 있는 조건이었다.

## 조사

셸과 npm 스크립트가 서로 다른 node를 쓰고 있었다.

```
shell node:     v23.11.0   (/opt/homebrew/bin/node)
npm exec node:  v20.18.0   (/Users/taejun/node_modules/node/bin/node)
```

`~/package.json`에 `node` 패키지가 의존성으로 들어가 있었다.

```json
"dependencies": {
  "node": "^20.18.0",
  ...
}
```

## 원인

npm은 스크립트를 실행할 때 현재 디렉토리부터 상위로 올라가며 만나는
모든 `node_modules/.bin`을 PATH 앞에 붙인다. 홈 디렉토리에 `node` npm 패키지가
설치되어 있어서 `~/node_modules/.bin/node`(v20.18.0)가 생겼고, 이게 PATH에서
Homebrew의 v23.11.0보다 앞서면서 셸의 node를 가렸다.

프로젝트와 무관한 홈 디렉토리 환경이 원인이므로, 홈 쪽은 건드리지 않고
프로젝트 안에서 격리했다.

## 해결

`scripts/run.mjs`를 만들어 PATH에서 `~/node_modules/.bin`만 걷어낸 뒤
실제 명령을 실행하도록 했다.

```json
"scripts": {
  "dev": "node scripts/run.mjs vite",
  "build": "node scripts/run.mjs tsc -b && node scripts/run.mjs vite build",
  "preview": "node scripts/run.mjs vite preview"
}
```

`.npmrc`의 `scripts-prepend-node-path=false`도 시도했으나 이 npm 버전(10.9.2)
에서는 효과가 없어 위 방식으로 대체했다.

## 검증

`npm run dev`, `npm run build` 모두 경고 없이 통과. dev 서버 HTTP 200 응답 확인.

## 재발 방지

- `package.json`에 `engines: { node: ">=20.19" }`, `.npmrc`에 `engine-strict=true`를
  넣어 버전이 미달하면 설치 단계에서 걸리게 했다.
- `.nvmrc`에 `22.20.0`을 기록해 권장 버전을 명시했다.

## 남은 것

근본 원인인 `~/package.json`의 `node` 의존성은 사용자 홈 환경이라 손대지 않았다.
다른 프로젝트에서도 같은 증상이 나올 수 있으며, 정리하려면 홈에서
`npm uninstall node`를 실행하면 된다. 다만 그 `package.json`에는
`@anthropic-ai/claude-code` 등 다른 의존성도 함께 있으므로 확인 후 진행할 것.
