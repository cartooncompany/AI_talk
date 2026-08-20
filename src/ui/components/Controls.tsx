/**
 * 관전 컨트롤.
 *
 * 사용자는 대화에 개입하지 않는다. 진행 속도와 재생 상태만 조절한다.
 */

import type { ConductorStatus } from '../../core/conductor';
import { SPEEDS } from '../match-setup';

interface ControlsProps {
  status: ConductorStatus;
  turnCount: number;
  speedIndex: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSpeedChange: (index: number) => void;
}

export function Controls({
  status,
  turnCount,
  speedIndex,
  onStart,
  onPause,
  onResume,
  onReset,
  onSpeedChange,
}: ControlsProps) {
  const finished = status === 'finished';

  return (
    <div className="controls">
      <span className="controls__count">턴 {turnCount}</span>

      <div className="controls__buttons">
        {status === 'idle' && (
          <button type="button" className="btn btn--primary" onClick={onStart}>
            ▶ 시작
          </button>
        )}
        {status === 'running' && (
          <button type="button" className="btn" onClick={onPause}>
            ⏸ 일시정지
          </button>
        )}
        {status === 'paused' && (
          <button type="button" className="btn btn--primary" onClick={onResume}>
            ▶ 재개
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={onReset}
          disabled={status === 'idle'}
        >
          ↺ {finished ? '다시' : '리셋'}
        </button>
      </div>

      <label className="controls__speed">
        <span className="controls__speed-label">속도</span>
        <select
          value={speedIndex}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
        >
          {SPEEDS.map((speed, index) => (
            <option key={speed.label} value={index}>
              {speed.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
