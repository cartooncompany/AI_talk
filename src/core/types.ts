/**
 * AI_Talk 코어 계약.
 *
 * Scenario(규칙) / Engine(발화 생성) / Conductor(턴 진행)는 이 파일의 타입으로만
 * 서로를 알고 있다. React나 브라우저 API에 의존하지 않으므로 나중에 서버로
 * 그대로 옮길 수 있다.
 */

/** 대화에 참여하는 AI 한 명. */
export interface Agent {
  id: string;
  /** 화면에 표시되는 이름. 예: "Claude" */
  name: string;
  /** 아바타로 쓸 이모지. */
  emoji: string;
  /** 말풍선/인디케이터에 쓸 테마 색 (CSS 색상값). */
  color: string;
}

/** 한 턴에서 나온 발화 하나. */
export interface Turn {
  /** 0부터 시작하는 턴 번호. */
  index: number;
  agentId: string;
  /** 에이전트가 실제로 내놓은 발화. */
  text: string;
  /** Scenario가 규칙에 맞다고 판정했는지. */
  valid: boolean;
  /** 규칙 위반일 때 그 이유. 유효하면 undefined. */
  reason?: string;
  /** 엔진이 응답하기까지 걸린 시간(ms). 관전 연출에 쓴다. */
  thinkingTime: number;
}

/** 게임이 끝난 이유. */
export type EndReason =
  /** 규칙을 위반해서 졌다. */
  | 'rule-violation'
  /** 최대 턴 수에 도달했다. */
  | 'turn-limit'
  /** 시나리오가 정한 다른 종료 조건. */
  | 'scenario-complete';

/** 게임 종료 결과. */
export interface MatchResult {
  reason: EndReason;
  /** 승자 없이 끝난 경우(무승부, 턴 제한) null. */
  winnerId: string | null;
  /** 사용자에게 보여줄 한 줄 설명. */
  summary: string;
}

/** Conductor가 관리하는 대화 전체 상태. */
export interface MatchState {
  agents: [Agent, Agent];
  turns: Turn[];
  /** 다음에 말할 에이전트의 id. 게임이 끝났으면 null. */
  currentAgentId: string | null;
  result: MatchResult | null;
}

/** Engine이 발화를 만들 때 참고하는 정보. */
export interface EngineContext {
  /** 발화해야 하는 에이전트 본인. */
  self: Agent;
  opponent: Agent;
  /** 지금까지의 유효한 턴들. 최신이 마지막. */
  history: Turn[];
  /** Scenario가 제공하는, 이번 턴에 필요한 규칙 요약 (예: 이어야 할 글자). */
  instruction: string;
}

/** Engine이 내놓은 발화. */
export interface EngineResponse {
  text: string;
  /** 이 응답을 만드는 데 걸린 시간(ms). Mock은 지연을 흉내내고, 실제 API는 실측값. */
  thinkingTime: number;
}

/**
 * 발화 생성기. MockEngine, ClaudeEngine, GeminiEngine이 이걸 구현한다.
 * Conductor는 어떤 구현인지 모른 채 이 인터페이스로만 호출한다.
 */
export interface Engine {
  /** 화면 표시용 이름. 예: "Mock", "Claude Opus 5" */
  readonly label: string;
  generate(context: EngineContext): Promise<EngineResponse>;
}

/** 발화가 규칙에 맞는지에 대한 Scenario의 판정. */
export type Judgement =
  | { valid: true }
  | { valid: false; reason: string };

/**
 * 대화의 규칙. 끝말잇기, 토론 등 각 종목이 이걸 구현한다.
 * 상태를 갖지 않으며, 판정에 필요한 모든 정보는 history로 받는다.
 */
export interface Scenario {
  id: string;
  /** 화면에 표시되는 종목명. 예: "끝말잇기" */
  name: string;
  /** 종목 설명 한 줄. */
  description: string;
  /** 대화를 여는 첫 발화. 시스템이 제시하며 어느 에이전트의 것도 아니다. */
  openingText: string;
  /** 안전장치. 이 턴 수에 도달하면 무조건 끝낸다. */
  maxTurns: number;
  /** 이번 턴에 발화자가 지켜야 할 규칙을 문장으로 만든다. Engine에 전달된다. */
  instructionFor(history: Turn[]): string;
  /** 발화가 규칙에 맞는지 판정한다. */
  judge(text: string, history: Turn[]): Judgement;
  /**
   * 규칙 위반 없이도 게임이 끝나는 조건이 있으면 결과를 반환한다.
   * 계속 진행해야 하면 null.
   */
  checkCompletion(history: Turn[], agents: [Agent, Agent]): MatchResult | null;
}
