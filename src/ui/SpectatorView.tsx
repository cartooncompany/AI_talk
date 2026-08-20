/**
 * 관전 화면.
 *
 * 상단 대전 카드, 중앙 메시지 스트림, 하단 컨트롤로 구성한다.
 */

import { useMemo, useState } from 'react';
import { Bubble } from './components/Bubble';
import { Controls } from './components/Controls';
import { Scoreboard } from './components/Scoreboard';
import { Thinking } from './components/Thinking';
import { useAutoScroll } from './hooks/useAutoScroll';
import { useMatch } from './hooks/useMatch';
import { AGENTS, SPEEDS, createMatch } from './match-setup';

export function SpectatorView() {
  const [speedIndex, setSpeedIndex] = useState(1);

  /**
   * 게임을 만든 시점의 속도. 엔진의 '생각하는 시간'이 여기서 정해진다.
   *
   * 진행 중 속도 변경은 턴 사이 간격에만 반영하고 엔진은 그대로 둔다.
   * 게임 도중 엔진을 바꾸면 진행하던 대화가 사라지기 때문이다.
   */
  const [round, setRound] = useState({ index: 0, speedIndex: 1 });
  const { scenario, engines } = useMemo(
    () => createMatch(round.index, round.speedIndex),
    [round],
  );

  const match = useMatch({
    scenario,
    agents: AGENTS,
    engines,
    turnDelay: SPEEDS[speedIndex].turnDelay,
    matchKey: round.index,
  });

  // 턴·생각중 표시·승패 카드 중 무엇이 추가돼도 스크롤이 따라가야 한다.
  const scrollKey = [
    match.turns.length,
    match.thinkingAgentId ?? '',
    match.result ? 'done' : '',
  ].join('|');
  const { ref, pinned, handleScroll } = useAutoScroll<HTMLOListElement>(scrollKey);

  const agentOf = (id: string) => AGENTS.find((agent) => agent.id === id) ?? AGENTS[0];
  const sideOf = (id: string): 'left' | 'right' =>
    id === AGENTS[0].id ? 'left' : 'right';

  const finished = match.status === 'finished';
  const lastIndex = match.turns.length - 1;

  const restart = () => {
    // 새 게임은 현재 선택된 속도로 시작한다.
    setRound((value) => ({ index: value.index + 1, speedIndex }));
  };

  return (
    <main className="stage">
      <header className="stage__header">
        <div className="stage__title">
          <h1>AI_Talk</h1>
          <p className="stage__scenario">
            {scenario.name} · {scenario.description}
          </p>
        </div>
        <Scoreboard
          agents={AGENTS}
          activeId={match.thinkingAgentId}
          winnerId={match.result?.winnerId ?? null}
          finished={finished}
        />
      </header>

      <section className="stream-wrap">
        <ol className="stream" ref={ref} onScroll={handleScroll}>
          <li className="opening">
            <span className="opening__label">시작 단어</span>
            <strong className="opening__word">{match.opening}</strong>
          </li>

          {match.turns.map((turn, index) => (
            <Bubble
              key={turn.index}
              turn={turn}
              agent={agentOf(turn.agentId)}
              side={sideOf(turn.agentId)}
              animate={index === lastIndex}
            />
          ))}

          {match.thinkingAgentId && (
            <Thinking
              agent={agentOf(match.thinkingAgentId)}
              side={sideOf(match.thinkingAgentId)}
            />
          )}

          {match.result && (
            <li className="verdict">
              <p className="verdict__summary">{match.result.summary}</p>
              <p className="verdict__meta">총 {match.turns.length}턴</p>
            </li>
          )}
        </ol>

        {!pinned && (
          <p className="stream__hint" role="status">
            아래로 스크롤하면 자동 추적이 다시 켜집니다
          </p>
        )}
      </section>

      <footer className="stage__footer">
        <Controls
          status={match.status}
          turnCount={match.turns.length}
          speedIndex={speedIndex}
          onStart={match.start}
          onPause={match.pause}
          onResume={match.resume}
          onReset={finished ? restart : match.reset}
          onSpeedChange={setSpeedIndex}
        />
      </footer>
    </main>
  );
}
