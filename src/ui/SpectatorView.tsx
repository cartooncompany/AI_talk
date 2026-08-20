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
  /** 값이 바뀌면 새 게임이 만들어진다. '다시' 버튼이 이 값을 올린다. */
  const [round, setRound] = useState(0);

  const { scenario, engines } = useMemo(() => createMatch(round), [round]);

  const match = useMatch({
    scenario,
    agents: AGENTS,
    engines,
    turnDelay: SPEEDS[speedIndex].turnDelay,
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
    setRound((value) => value + 1);
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
