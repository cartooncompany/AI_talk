/**
 * 로컬 CLI(vite, tsc)를 올바른 Node로 실행한다.
 *
 * 홈 디렉토리에 `node` npm 패키지(v20.18.0)가 설치되어 있으면 npm이
 * `~/node_modules/.bin`을 스크립트 PATH 앞에 붙이고, 그 구버전 node가
 * 셸의 node를 가린다. Vite 8은 20.19+를 요구하므로 경고가 뜨고 동작이
 * 어긋날 수 있다. 여기서 그 항목만 PATH에서 걷어낸 뒤 실행한다.
 */
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join, delimiter } from 'node:path';

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error('usage: node scripts/run.mjs <command> [args...]');
  process.exit(1);
}

const shadowed = join(homedir(), 'node_modules', '.bin');
const path = (process.env.PATH ?? '')
  .split(delimiter)
  .filter((entry) => entry !== shadowed)
  .join(delimiter);

const child = spawn(cmd, args, {
  stdio: 'inherit',
  env: { ...process.env, PATH: path },
  shell: process.platform === 'win32',
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
child.on('error', (err) => {
  console.error(err.message);
  process.exit(1);
});
