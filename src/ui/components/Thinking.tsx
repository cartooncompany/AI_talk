/**
 * "생각 중" 인디케이터.
 *
 * 엔진이 응답하기까지 화면이 비면 멈춘 것처럼 보인다. 실제 API를 붙이면
 * 지연이 더 길어지므로 이 표시가 더 중요해진다.
 */

import type { Agent } from '../../core/types';

interface ThinkingProps {
  agent: Agent;
  side: 'left' | 'right';
}

export function Thinking({ agent, side }: ThinkingProps) {
  return (
    <li className={`bubble bubble--${side} bubble--thinking`}>
      <span className="bubble__avatar" aria-hidden="true">
        {agent.emoji}
      </span>
      <div className="bubble__body">
        <span className="bubble__name">{agent.name}</span>
        <p className="bubble__text" style={{ borderColor: agent.color }}>
          <span className="dots" aria-label={`${agent.name}이(가) 생각 중`}>
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
    </li>
  );
}
