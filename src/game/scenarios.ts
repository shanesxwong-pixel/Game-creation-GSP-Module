import { BoardGrid, PlayerColor, ScenarioConfig, ScenarioType } from '../types/game';
import { BOARD_SIZE } from './rules';

export const SCENARIOS: Record<ScenarioType, ScenarioConfig> = {
  competitive: {
    id: 'competitive',
    title: 'Competitive (Standard Gameplay)',
    subtitle: 'Classic Territorial Defense & Chokepoints',
    badge: 'Standard Blokus Rules',
    description:
      'Pure territorial Blokus with no exchange cards or lifelines. Players expand diagonally from corners, locking down corridors and defending open territory.',
    primaryColor: '#cf6666',
    accentGlow: 'rgba(207, 102, 102, 0.35)',
    ambientVibe: 'Warm terracotta stone with precise boundary lines',
    ruleExplanation:
      'Standard Blokus rules. Corner-to-corner contacts only; edges cannot touch your own color. No power cards or exchange mechanics active.',
    objectiveText:
      'Deploy maximum pieces while blocking enemy expansion routes across the grid.',
    allowExchange: false,
    allowPowerCards: false,
  },
  face_saving: {
    id: 'face_saving',
    title: 'Face-Saving & Strategic De-escalation',
    subtitle: 'Face-Negotiation Theory & Dignified Retreat',
    badge: 'Face-Saving Protocol',
    description:
      'Translates Ting-Toomey’s Face-Negotiation Theory into spatial strategy. When about to box an opponent in, play the "Face-Saving Lifeline" power card to leave an escape corner open, earning Politeness Tokens (-3 penalty squares).',
    primaryColor: '#4d7cbb',
    accentGlow: 'rgba(77, 124, 187, 0.35)',
    ambientVibe: 'Calm slate denim with luminous diplomatic corridors',
    ruleExplanation:
      'Shifts from toxic blocker mentalities to mutual dignity. Offering a lifeline allows Player B to retain autonomy and grants Player A Politeness Tokens.',
    objectiveText:
      'Avoid humiliating opponents: preserve escape avenues to accumulate Politeness Tokens (-3 endgame penalty each).',
    allowExchange: false,
    allowPowerCards: true,
  },
  mediator_bridge: {
    id: 'mediator_bridge',
    title: 'The Mediator’s Bridge (Winner’s Triangle)',
    subtitle: 'From Karpman’s Drama to Choy’s Winner’s Triangle & 1-Min Negotiation',
    badge: 'Winner’s Triangle',
    description:
      'Break free from the Karpman Drama Triangle (Persecutor/Victim/Rescuer) into Choy’s Winner’s Triangle (Assertive/Vulnerable/Caring). Deploy "The Mediator’s Bridge" to unlock mutual pathways and conduct 1-minute time-bounded tile exchanges.',
    primaryColor: '#4e9a7e',
    accentGlow: 'rgba(78, 154, 126, 0.35)',
    ambientVibe: 'Organic sage willow with collaborative bridge conduits',
    ruleExplanation:
      'Placing a bridge out of an opponent’s choke zone grants a Mediator’s Token + an immediate bonus turn. Propose tile trades with a strict 1-minute negotiation countdown timer (turn forfeits if expired).',
    objectiveText:
      'Negotiate mutually advantageous tile trades under the 1-minute timer and construct bridges to score Mediator’s Tokens.',
    allowExchange: true,
    allowPowerCards: true,
  },
  // Legacy aliases
  destructive: {
    id: 'destructive',
    title: 'Competitive (Standard Gameplay)',
    subtitle: 'Classic Territorial Defense & Chokepoints',
    badge: 'Standard Blokus Rules',
    description:
      'Pure territorial Blokus with no exchange cards or lifelines.',
    primaryColor: '#cf6666',
    accentGlow: 'rgba(207, 102, 102, 0.35)',
    ambientVibe: 'Warm terracotta stone',
    ruleExplanation:
      'Standard Blokus rules. Corner-to-corner contacts only; no exchange mechanics.',
    objectiveText: 'Deploy maximum pieces while contesting territorial control.',
    allowExchange: false,
    allowPowerCards: false,
  },
  collaborative: {
    id: 'collaborative',
    title: 'The Mediator’s Bridge (Winner’s Triangle)',
    subtitle: 'From Karpman’s Drama to Choy’s Winner’s Triangle & 1-Min Negotiation',
    badge: 'Winner’s Triangle',
    description:
      'Deploy the Mediator’s Bridge and conduct 1-minute time-bounded tile exchanges.',
    primaryColor: '#4e9a7e',
    accentGlow: 'rgba(78, 154, 126, 0.35)',
    ambientVibe: 'Organic sage willow with collaborative conduits',
    ruleExplanation:
      'Build bridges for mutual exits; conduct 1-minute tile exchanges.',
    objectiveText: 'Weave mutual pathways and negotiate tile trades.',
    allowExchange: true,
    allowPowerCards: true,
  },
  last_tile_challenge: {
    id: 'last_tile_challenge',
    title: 'Face-Saving & Strategic De-escalation',
    subtitle: 'Face-Negotiation Theory & Dignified Retreat',
    badge: 'Face-Saving Protocol',
    description:
      'Translates Ting-Toomey’s Face-Negotiation Theory into spatial strategy.',
    primaryColor: '#4d7cbb',
    accentGlow: 'rgba(77, 124, 187, 0.35)',
    ambientVibe: 'Calm slate denim with diplomatic corridors',
    ruleExplanation:
      'Deploy the Face-Saving Lifeline to earn Politeness Tokens.',
    objectiveText: 'Preserve escape avenues and earn Politeness Tokens.',
    allowExchange: false,
    allowPowerCards: true,
  },
};

export interface MoveStyleAnalysis {
  destructiveScore: number; // 0 to 100
  collaborativeScore: number; // 0 to 100
  challengeScore: number; // 0 to 100
  dominantStyle: ScenarioType;
  tacticalNotes: string[];
}

// Analyze a placed piece against current board state
export function analyzeMoveStyle(
  boardBefore: BoardGrid,
  matrix: number[][],
  row: number,
  col: number,
  color: PlayerColor,
  remainingPiecesCount: number
): MoveStyleAnalysis {
  let opponentCutoffs = 0;
  let friendlyBridges = 0;
  let cornerContactCount = 0;
  let densitySurround = 0;

  const rows = matrix.length;
  const cols = matrix[0].length;
  const pieceSize = matrix.flat().filter((x) => x === 1).length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] !== 1) continue;
      const br = row + r;
      const bc = col + c;

      // Check diagonal friendlies
      const diagonals = [
        [br - 1, bc - 1],
        [br - 1, bc + 1],
        [br + 1, bc - 1],
        [br + 1, bc + 1],
      ];
      for (const [dr, dc] of diagonals) {
        if (dr >= 0 && dr < BOARD_SIZE && dc >= 0 && dc < BOARD_SIZE) {
          if (boardBefore[dr][dc] === color) {
            cornerContactCount++;
          }
        }
      }

      // Check proximity to opposing pieces (destructive cutoff / choke)
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = br + dr;
          const nc = bc + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            const oppColor = boardBefore[nr][nc];
            if (oppColor !== null && oppColor !== color) {
              opponentCutoffs++;
            }
          }
        }
      }

      // Check board edge/packing tightness
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = br + dr;
          const nc = bc + dc;
          if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE || boardBefore[nr][nc] !== null) {
            densitySurround++;
          }
        }
      }
    }
  }

  // Calculate scores
  const destructiveScore = Math.min(100, Math.round(opponentCutoffs * 7));
  const collaborativeScore = Math.min(
    100,
    Math.round((cornerContactCount * 18 + (BOARD_SIZE - Math.abs(row - 10) - Math.abs(col - 10)) * 2))
  );

  // Challenge score scales as remaining pieces decrease and packing tightness increases
  const piecesPlacedSoFar = 21 - remainingPiecesCount;
  const endgameBonus = piecesPlacedSoFar > 15 ? 40 : 10;
  const packingRatio = Math.min(40, densitySurround * 2);
  const challengeScore = Math.min(100, Math.round(endgameBonus + packingRatio + (pieceSize === 1 ? 40 : 0)));

  const tacticalNotes: string[] = [];
  if (destructiveScore > 40) {
    tacticalNotes.push(`Chokepoint cut: denied ${opponentCutoffs} opponent corridors`);
  }
  if (collaborativeScore > 40) {
    tacticalNotes.push(`Harmonic nexus weave: +${cornerContactCount} corner conduits formed`);
  }
  if (pieceSize === 1 && remainingPiecesCount === 1) {
    tacticalNotes.push('MONOMINO GAMBIT: Precision 1-square clincher executed!');
  } else if (remainingPiecesCount <= 5) {
    tacticalNotes.push(`Endgame squeeze: ${remainingPiecesCount} pieces remaining`);
  }

  // Determine dominant
  let dominantStyle: ScenarioType = 'collaborative';
  if (destructiveScore >= collaborativeScore && destructiveScore >= challengeScore) {
    dominantStyle = 'destructive';
  } else if (challengeScore >= collaborativeScore && challengeScore > destructiveScore) {
    dominantStyle = 'last_tile_challenge';
  }

  return {
    destructiveScore,
    collaborativeScore,
    challengeScore,
    dominantStyle,
    tacticalNotes,
  };
}
