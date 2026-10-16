import { BoardGrid, PlacedPiece, Player, PlayerColor, PlayerScoreReport, ScenarioType } from '../types/game';
import { ALL_PIECES } from './pieces';
import { BOARD_SIZE } from './rules';
import { analyzeMoveStyle } from './scenarios';

export const TOTAL_PLAYER_SQUARES = 89;
export const TOTAL_BOARD_CELLS = BOARD_SIZE * BOARD_SIZE; // 400

export function computeGameScores(
  players: Player[],
  board: BoardGrid,
  history: PlacedPiece[]
): PlayerScoreReport[] {
  // Count squares placed per color
  const colorSquaresPlaced: Record<PlayerColor, number> = {
    blue: 0,
    yellow: 0,
    red: 0,
    green: 0,
  };

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const color = board[r][c];
      if (color) {
        colorSquaresPlaced[color]++;
      }
    }
  }

  const totalAllSquaresPlaced = Object.values(colorSquaresPlaced).reduce((a, b) => a + b, 0);

  // Sort reports descending by traditional score first
  const reports: PlayerScoreReport[] = players.map((player) => {
    const placedSquares = colorSquaresPlaced[player.color] || 0;
    const squaresRemaining = TOTAL_PLAYER_SQUARES - placedSquares;

    // Filter player history to check last placed piece
    const playerPieces = history.filter((p) => p.playerId === player.id || p.color === player.color);
    const playedAllPieces = playerPieces.length === ALL_PIECES.length;
    const lastPiece = playerPieces[playerPieces.length - 1];
    const monominoLastBonus = playedAllPieces && lastPiece?.pieceId === 'I1';

    let traditionalScore = -squaresRemaining;
    if (playedAllPieces) {
      traditionalScore += 15;
      if (monominoLastBonus) {
        traditionalScore += 5; // Total +20 bonus
      }
    }

    const percentageCompleted = Number(((placedSquares / TOTAL_PLAYER_SQUARES) * 100).toFixed(1));
    const boardSharePercentage =
      totalAllSquaresPlaced > 0
        ? Number(((placedSquares / totalAllSquaresPlaced) * 100).toFixed(1))
        : 0;
    const boardCoveragePercentage = Number(
      ((placedSquares / TOTAL_BOARD_CELLS) * 100).toFixed(1)
    );

    // Diplomacy & Tokens calculations
    const politenessTokens = player.politenessTokens || 0;
    const politenessScoreDeduction = politenessTokens * 3; // deducts 3 penalty squares each
    const mediatorTokens = player.mediatorTokens || 0;
    const mediatorBonusPoints = mediatorTokens * 4;

    // Milestones
    const milestones: import('../types/game').PsychologicalMilestones = {
      faceSaved: Boolean(player.faceSavedMilestone),
      escapedDramaTriangle: Boolean(player.escapedDramaTriangleMilestone),
      negotiatedAccord: Boolean(player.negotiationAccordMilestone),
    };

    // Final Adjusted Score formula:
    // Penalty squares remaining reduced by politeness deductions (-3 each) and mediator bonuses (-4 each)
    const penaltySquaresAdjusted = Math.max(0, squaresRemaining - politenessScoreDeduction - mediatorBonusPoints);
    const finalAdjustedScore = traditionalScore + politenessScoreDeduction + mediatorBonusPoints;

    const formulaExplanation = `Base [${traditionalScore}] + Politeness [${politenessTokens} × 3 = +${politenessScoreDeduction}] + Mediator [${mediatorTokens} × 4 = +${mediatorBonusPoints}] = ${finalAdjustedScore} pts`;

    // Calculate style profile from move history
    let destructiveSum = 0;
    let collaborativeSum = 0;
    let challengeSum = 0;

    for (const move of playerPieces) {
      const analysis = analyzeMoveStyle(
        board,
        move.matrix,
        move.row,
        move.col,
        move.color,
        21 - playerPieces.indexOf(move)
      );
      destructiveSum += analysis.destructiveScore;
      collaborativeSum += analysis.collaborativeScore;
      challengeSum += analysis.challengeScore;
    }

    const movesCount = Math.max(1, playerPieces.length);
    const avgDestructive = Math.round(destructiveSum / movesCount);
    const avgCollaborative = Math.round(collaborativeSum / movesCount);
    const avgChallenge = Math.round(challengeSum / movesCount);

    let dominantStyle: ScenarioType = 'mediator_bridge';
    if (avgDestructive >= avgCollaborative && avgDestructive >= avgChallenge) {
      dominantStyle = 'competitive';
    } else if (avgChallenge >= avgCollaborative && avgChallenge > avgDestructive) {
      dominantStyle = 'face_saving';
    }

    return {
      playerId: player.id,
      playerName: player.name,
      color: player.color,
      isWinner: false,
      // 1. Standard Ledger
      placedSquares,
      totalPossibleSquares: TOTAL_PLAYER_SQUARES,
      piecesRemainingCount: ALL_PIECES.length - playerPieces.length,
      squaresRemainingCount: squaresRemaining,
      traditionalScore,
      playedAllPieces,
      monominoLastBonus,
      // 2. The Diplomacy Log
      politenessTokens,
      politenessScoreDeduction,
      mediatorTokens,
      negotiationsCompleted: player.negotiationAccordMilestone ? 1 : 0,
      // 3. Psychological Milestones
      milestones,
      // 4. Final Adjusted Standings
      finalAdjustedScore,
      penaltySquaresAdjusted,
      formulaExplanation,
      percentageCompleted,
      boardSharePercentage,
      boardCoveragePercentage,
      styleProfile: {
        destructiveScore: avgDestructive,
        collaborativeScore: avgCollaborative,
        challengeScore: avgChallenge,
        dominantStyle,
      },
    };
  });

  // Determine winner: highest final adjusted score (ties broken by traditional score)
  let maxAdjustedScore = -Infinity;
  for (const rep of reports) {
    if (rep.finalAdjustedScore > maxAdjustedScore) {
      maxAdjustedScore = rep.finalAdjustedScore;
    }
  }

  for (const rep of reports) {
    if (rep.finalAdjustedScore === maxAdjustedScore) {
      rep.isWinner = true;
    }
  }

  // Sort descending by final adjusted score
  return reports.sort((a, b) => b.finalAdjustedScore - a.finalAdjustedScore);
}

export function getMasteryTitle(report: PlayerScoreReport): { title: string; subtitle: string } {
  if (report.monominoLastBonus) {
    return {
      title: 'Grandmaster Monomino Legend',
      subtitle: 'Executed the legendary last-tile Monomino gambit to perfection!',
    };
  }
  if (report.playedAllPieces) {
    return {
      title: 'Grandmaster Architect',
      subtitle: 'Successfully placed 100% of all 21 polyomino pieces!',
    };
  }
  if (report.percentageCompleted >= 90) {
    return {
      title: 'Master Tactician',
      subtitle: 'Locked down over 90% territory efficiency under pressure.',
    };
  }
  if (report.styleProfile.dominantStyle === 'destructive') {
    return {
      title: 'Siege Warlord',
      subtitle: 'Master of territorial chokeholds and ruthless corner denial.',
    };
  }
  if (report.styleProfile.dominantStyle === 'collaborative') {
    return {
      title: 'Nexus Weaver',
      subtitle: 'Exquisite harmonic mosaic placement and organic corner bridges.',
    };
  }
  return {
    title: 'Precision Pioneer',
    subtitle: 'Calculated every tile footprint with mathematical poise.',
  };
}
