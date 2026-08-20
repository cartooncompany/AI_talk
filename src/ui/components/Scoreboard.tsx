/**
 * 상단 대전 카드.
 *
 * 누가 대결하는지, 지금 누구 차례인지 보여준다.
 */

import type { Agent } from '../../core/types';

interface ScoreboardProps {
  agents: [Agent, Agent];
  /** 지금 생각 중인 에이전트. 없으면 null. */
  activeId: string | null;
  winnerId: string | null;
  finished: boolean;
}

export function Scoreboard({ agents, activeId, winnerId, finished }: ScoreboardProps) {
  return (
    <div className="scoreboard">
      {agents.map((agent, index) => {
        const active = agent.id === activeId;
        const won = finished && agent.id === winnerId;
        const lost = finished && winnerId !== null && agent.id !== winnerId;
        return (
          <div key={agent.id} className="scoreboard__slot">
            {index === 1 && <span className="scoreboard__vs">VS</span>}
            <div
              className={[
                'player',
                active ? 'player--active' : '',
                won ? 'player--won' : '',
                lost ? 'player--lost' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ '--player-color': agent.color } as React.CSSProperties}
            >
              <span className="player__emoji" aria-hidden="true">
                {agent.emoji}
              </span>
              <span className="player__name">{agent.name}</span>
              <span className="player__status">
                {won && '승리'}
                {lost && '패배'}
                {!finished && active && '생각 중'}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
