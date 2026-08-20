/**
 * 발화 하나를 담는 말풍선.
 *
 * 두 에이전트를 좌우로 나눠 배치해 누가 말했는지 한눈에 보이게 한다.
 * 규칙 위반은 색과 사유로 명확히 구분한다 — 왜 졌는지가 관전의 핵심이다.
 */

import { useTypewriter } from '../hooks/useTypewriter';
import type { Agent, Turn } from '../../core/types';

interface BubbleProps {
  turn: Turn;
  agent: Agent;
  side: 'left' | 'right';
  /** 방금 도착한 발화만 타이핑 연출한다. 지난 것은 즉시 표시. */
  animate: boolean;
}

export function Bubble({ turn, agent, side, animate }: BubbleProps) {
  const { shown, done } = useTypewriter(turn.text, { enabled: animate });

  return (
    <li className={`bubble bubble--${side} ${turn.valid ? '' : 'bubble--invalid'}`}>
      <span className="bubble__avatar" aria-hidden="true">
        {agent.emoji}
      </span>
      <div className="bubble__body">
        <span className="bubble__name">{agent.name}</span>
        <p className="bubble__text" style={{ borderColor: agent.color }}>
          {shown}
          {!done && <span className="bubble__caret" aria-hidden="true" />}
        </p>
        {!turn.valid && turn.reason && (
          <p className="bubble__reason">✗ {turn.reason}</p>
        )}
      </div>
    </li>
  );
}
