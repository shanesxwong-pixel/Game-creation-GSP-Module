export type PlayerColor = 'blue' | 'yellow' | 'red' | 'green';

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  isBot: boolean;
  botPersonality?: 'destructive' | 'collaborative' | 'balanced' | 'puzzle_master';
  isReady: boolean;
  hasPassed: boolean;
  // Diplomacy and Power Card inventory
  politenessTokens: number; // -3 penalty squares each
  mediatorTokens: number; // tracks mutual-benefit bridging
  hasFaceSavingLifeline: boolean;
  hasMediatorBridgeCard: boolean;
  bonusActionsRemaining: number;
  faceSavedMilestone: boolean;
  escapedDramaTriangleMilestone: boolean;
  negotiationAccordMilestone: boolean;
  // Bound escape corner from accepted lifeline
  obligatedCorner?: { row: number; col: number } | null;
}

export type ScenarioType =
  | 'competitive'
  | 'face_saving'
  | 'mediator_bridge'
  | 'destructive'
  | 'collaborative'
  | 'last_tile_challenge';

export interface ScenarioConfig {
  id: ScenarioType;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  primaryColor: string;
  accentGlow: string;
  ambientVibe: string;
  ruleExplanation: string;
  objectiveText: string;
  allowExchange: boolean;
  allowPowerCards: boolean;
}

export interface PieceDef {
  id: string;
  name: string;
  size: number; // 1 to 5
  matrix: number[][]; // 2D array representation
}

export interface PlacedPiece {
  id: string;
  pieceId: string;
  color: PlayerColor;
  playerId: string;
  row: number;
  col: number;
  matrix: number[][];
  turnNumber: number;
  timestamp: number;
  styleClass?: ScenarioType;
  isBridge?: boolean;
}

export type BoardGrid = (PlayerColor | null)[][];

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor?: PlayerColor;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isEmote?: boolean;
}

export interface ActiveNegotiation {
  id: string;
  initiatorId: string;
  initiatorName: string;
  initiatorColor: PlayerColor;
  targetId: string;
  targetName: string;
  targetColor: PlayerColor;
  offeredPieceId: string;
  requestedPieceId: string;
  createdAt: number;
  expiresAt: number; // 60 seconds from createdAt
  status: 'pending' | 'accepted' | 'declined' | 'timed_out';
}

export interface PsychologicalMilestones {
  faceSaved: boolean; // Checked by Player B if they accepted a lifeline
  escapedDramaTriangle: boolean; // Checked by both players if a Mediator’s Bridge was successfully built
  negotiatedAccord: boolean; // Checked if players completed an exchange under 1-minute timer
}

export interface PlayerScoreReport {
  playerId: string;
  playerName: string;
  color: PlayerColor;
  isWinner: boolean;
  // 1. Standard Ledger
  placedSquares: number;
  totalPossibleSquares: number; // 89
  piecesRemainingCount: number;
  squaresRemainingCount: number;
  traditionalScore: number; // -squaresRemaining + bonuses
  playedAllPieces: boolean;
  monominoLastBonus: boolean;
  // 2. The Diplomacy Log
  politenessTokens: number;
  politenessScoreDeduction: number; // politenessTokens * 3
  mediatorTokens: number;
  negotiationsCompleted: number;
  // 3. Psychological Milestones
  milestones: PsychologicalMilestones;
  // 4. Final Adjusted Standings
  finalAdjustedScore: number; // traditionalScore + (politenessTokens * 3) + (mediatorTokens * 4) OR penalty squares reduced
  penaltySquaresAdjusted: number; // squaresRemainingCount - (politenessTokens * 3) - (mediatorTokens * 4)
  formulaExplanation: string;
  // Percentages & Telemetry
  percentageCompleted: number;
  boardSharePercentage: number;
  boardCoveragePercentage: number;
  styleProfile: {
    destructiveScore: number;
    collaborativeScore: number;
    challengeScore: number;
    dominantStyle: ScenarioType;
  };
}

export interface StageInfo {
  stageNumber: 1 | 2 | 3;
  name: string;
  tagline: string;
  advice: string;
  color: string;
  progressPercent: number;
}

export interface RoomState {
  roomId: string;
  roomName: string;
  scenario: ScenarioType;
  players: Player[];
  status: 'lobby' | 'playing' | 'ended';
  maxPlayers: 4;
  boardSize: number; // 20
  turnIndex: number;
  turnTimeLimit: number; // seconds, 0 for unlimited
  history: PlacedPiece[];
  winnerIds: string[];
  startWithPromptedTiles?: boolean;
  // Live negotiation offer
  activeNegotiation: ActiveNegotiation | null;
  // Active lifeline offer awaiting response
  activeLifelineOffer: {
    proposerId: string;
    targetId: string;
    corner: { row: number; col: number };
  } | null;
  // Diplomatic exchange count
  totalNegotiationsCompleted: number;
}

