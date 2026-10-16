import { BoardGrid, PlayerColor } from '../types/game';
import { ALL_PIECES, getAllPieceVariations } from './pieces';

export const BOARD_SIZE = 20;

export const STARTING_CORNERS: Record<PlayerColor, [number, number]> = {
  blue: [0, 0],
  yellow: [0, BOARD_SIZE - 1],
  red: [BOARD_SIZE - 1, BOARD_SIZE - 1],
  green: [BOARD_SIZE - 1, 0],
};

export const COLOR_CONFIG: Record<
  PlayerColor,
  {
    name: string;
    hex: string;
    glowHex: string;
    tailwindText: string;
    tailwindBg: string;
    tailwindBorder: string;
  }
> = {
  blue: {
    name: 'Slate Denim',
    hex: '#4f7bb6',
    glowHex: '#7ca0d2',
    tailwindText: 'text-[#90b5e8]',
    tailwindBg: 'bg-[#395b8a]',
    tailwindBorder: 'border-[#557ea8]',
  },
  yellow: {
    name: 'Warm Ochre',
    hex: '#c99648',
    glowHex: '#e0b370',
    tailwindText: 'text-[#e8c382]',
    tailwindBg: 'bg-[#916b32]',
    tailwindBorder: 'border-[#b38b44]',
  },
  red: {
    name: 'Terracotta Rose',
    hex: '#c26262',
    glowHex: '#dc8787',
    tailwindText: 'text-[#e88f8f]',
    tailwindBg: 'bg-[#8f4747]',
    tailwindBorder: 'border-[#b15e5e]',
  },
  green: {
    name: 'Muted Sage',
    hex: '#4e9a7e',
    glowHex: '#77bba2',
    tailwindText: 'text-[#80cda9]',
    tailwindBg: 'bg-[#366e58]',
    tailwindBorder: 'border-[#4e8f75]',
  },
};

export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

// Check if player has placed any pieces on the board yet
export function isPlayerFirstMove(board: BoardGrid, color: PlayerColor): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === color) return false;
    }
  }
  return true;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  coversCorner?: boolean;
  touchesDiagonal?: boolean;
  touchesEdge?: boolean;
  overlaps?: boolean;
  outOfBounds?: boolean;
}

// Validate whether placing matrix at (topRow, leftCol) is legal for color
export function validatePlacement(
  board: BoardGrid,
  matrix: number[][],
  topRow: number,
  leftCol: number,
  color: PlayerColor
): ValidationResult {
  const isFirst = isPlayerFirstMove(board, color);
  const [startR, startC] = STARTING_CORNERS[color];

  let coversCorner = false;
  let touchesDiagonal = false;
  let touchesEdge = false;
  let overlaps = false;
  let outOfBounds = false;

  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] !== 1) continue;

      const br = topRow + r;
      const bc = leftCol + c;

      // Bounds check
      if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE) {
        outOfBounds = true;
        return { valid: false, reason: 'Placement is out of board bounds', outOfBounds: true };
      }

      // Overlap check
      if (board[br][bc] !== null) {
        overlaps = true;
        return { valid: false, reason: 'Tile overlaps an occupied square', overlaps: true };
      }

      // Check if covers start corner
      if (br === startR && bc === startC) {
        coversCorner = true;
      }

      // Check orthogonal edges (MUST NOT touch same color)
      const orthogonal = [
        [br - 1, bc],
        [br + 1, bc],
        [br, bc - 1],
        [br, bc + 1],
      ];

      for (const [or, oc] of orthogonal) {
        if (or >= 0 && or < BOARD_SIZE && oc >= 0 && oc < BOARD_SIZE) {
          if (board[or][oc] === color) {
            touchesEdge = true;
            return {
              valid: false,
              reason: 'Pieces of your own color cannot touch edges',
              touchesEdge: true,
            };
          }
        }
      }

      // Check diagonal corners (MUST touch at least one same color if not first move)
      const diagonal = [
        [br - 1, bc - 1],
        [br - 1, bc + 1],
        [br + 1, bc - 1],
        [br + 1, bc + 1],
      ];

      for (const [dr, dc] of diagonal) {
        if (dr >= 0 && dr < BOARD_SIZE && dc >= 0 && dc < BOARD_SIZE) {
          if (board[dr][dc] === color) {
            touchesDiagonal = true;
          }
        }
      }
    }
  }

  if (isFirst) {
    if (!coversCorner) {
      return {
        valid: false,
        reason: `Your first piece must cover your starting corner (${startR + 1}, ${startC + 1})`,
        coversCorner: false,
      };
    }
    return { valid: true, coversCorner: true };
  }

  if (!touchesDiagonal) {
    return {
      valid: false,
      reason: 'Piece must touch at least one diagonal corner of your own color',
      touchesDiagonal: false,
    };
  }

  return { valid: true, touchesDiagonal: true };
}

// Apply move and return new board
export function applyMove(
  board: BoardGrid,
  matrix: number[][],
  topRow: number,
  leftCol: number,
  color: PlayerColor
): BoardGrid {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[0].length; c++) {
      if (matrix[r][c] === 1) {
        newBoard[topRow + r][leftCol + c] = color;
      }
    }
  }
  return newBoard;
}

// Find all legal placements for a given piece matrix
export function getLegalPlacementsForMatrix(
  board: BoardGrid,
  matrix: number[][],
  color: PlayerColor
): { row: number; col: number }[] {
  const results: { row: number; col: number }[] = [];
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let r = 0; r <= BOARD_SIZE - rows; r++) {
    for (let c = 0; c <= BOARD_SIZE - cols; c++) {
      if (validatePlacement(board, matrix, r, c, color).valid) {
        results.push({ row: r, col: c });
      }
    }
  }

  return results;
}

// Check if player has ANY legal move available with their remaining pieces
export function hasAnyLegalMove(
  board: BoardGrid,
  color: PlayerColor,
  remainingPieceIds: string[]
): boolean {
  for (const pieceId of remainingPieceIds) {
    const piece = ALL_PIECES.find((p) => p.id === pieceId);
    if (!piece) continue;

    const variations = getAllPieceVariations(piece.matrix);
    for (const matrix of variations) {
      const legal = getLegalPlacementsForMatrix(board, matrix, color);
      if (legal.length > 0) return true;
    }
  }
  return false;
}

// AI move generator with scenario style weights
export function generateAIMove(
  board: BoardGrid,
  color: PlayerColor,
  remainingPieceIds: string[],
  style: 'destructive' | 'collaborative' | 'balanced' | 'puzzle_master'
): { pieceId: string; matrix: number[][]; row: number; col: number; score: number } | null {
  const candidateMoves: {
    pieceId: string;
    matrix: number[][];
    row: number;
    col: number;
    score: number;
  }[] = [];

  // Sort remaining pieces by size depending on style
  // Usually, play largest pieces first in Blokus
  const piecesToEvaluate = ALL_PIECES.filter((p) => remainingPieceIds.includes(p.id)).sort(
    (a, b) => b.size - a.size
  );

  for (const piece of piecesToEvaluate) {
    const variations = getAllPieceVariations(piece.matrix);
    for (const matrix of variations) {
      const legalPlacements = getLegalPlacementsForMatrix(board, matrix, color);
      for (const pos of legalPlacements) {
        let score = piece.size * 10; // base score for placing larger piece

        // Evaluate board dynamics based on style
        const centerRow = BOARD_SIZE / 2;
        const centerCol = BOARD_SIZE / 2;
        const distToCenter = Math.hypot(pos.row - centerRow, pos.col - centerCol);

        if (style === 'destructive') {
          // Destructive: advance heavily toward opponents' territory and cutoff their corners
          score += (BOARD_SIZE - distToCenter) * 4;

          // Check if placement sits near opposing colors
          for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
              if (matrix[r][c] !== 1) continue;
              const br = pos.row + r;
              const bc = pos.col + c;
              // Check neighborhood for opponent pieces
              for (let dr = -2; dr <= 2; dr++) {
                for (let dc = -2; dc <= 2; dc++) {
                  const nr = br + dr;
                  const nc = bc + dc;
                  if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                    if (board[nr][nc] !== null && board[nr][nc] !== color) {
                      score += 15; // Aggressive blocking value
                    }
                  }
                }
              }
            }
          }
        } else if (style === 'collaborative') {
          // Collaborative: spread out gracefully, maximize corner touches without suffocating
          score += piece.size * 12;
          score += distToCenter * 2; // leave center open, weave harmoniously
        } else if (style === 'puzzle_master') {
          // Keep smaller pieces (especially Monomino and Domino) for the absolute endgame
          if (piece.size === 1) score -= 50; // Save monomino!
          if (piece.size === 2) score -= 25;
          score += piece.size * 15;
          score += (BOARD_SIZE - distToCenter) * 2;
        } else {
          // Balanced
          score += piece.size * 10 - distToCenter;
        }

        candidateMoves.push({
          pieceId: piece.id,
          matrix,
          row: pos.row,
          col: pos.col,
          score,
        });

        // Fast-path cap so search stays snappy (<= 50ms)
        if (candidateMoves.length > 40) break;
      }
      if (candidateMoves.length > 40) break;
    }
    if (candidateMoves.length > 25) break;
  }

  if (candidateMoves.length === 0) return null;

  // Pick highest scoring move with a touch of randomness among top 3
  candidateMoves.sort((a, b) => b.score - a.score);
  const topSlice = candidateMoves.slice(0, Math.min(3, candidateMoves.length));
  return topSlice[Math.floor(Math.random() * topSlice.length)];
}

// Generate pre-prompted starting tiles for all players covering their designated corners
export function getKickstartOpeningPieces(players: { id: string; color: PlayerColor }[]): import('../types/game').PlacedPiece[] {
  const prompted: import('../types/game').PlacedPiece[] = [];

  // Corner configuration for V3 triomino piece (3 squares)
  const pieceConfigs: Record<PlayerColor, { row: number; col: number; matrix: number[][] }> = {
    blue: {
      row: 0,
      col: 0,
      matrix: [
        [1, 0],
        [1, 1],
      ],
    },
    yellow: {
      row: 0,
      col: BOARD_SIZE - 2,
      matrix: [
        [0, 1],
        [1, 1],
      ],
    },
    red: {
      row: BOARD_SIZE - 2,
      col: BOARD_SIZE - 2,
      matrix: [
        [1, 1],
        [0, 1],
      ],
    },
    green: {
      row: BOARD_SIZE - 2,
      col: 0,
      matrix: [
        [1, 1],
        [1, 0],
      ],
    },
  };

  players.forEach((p, idx) => {
    const cfg = pieceConfigs[p.color];
    if (cfg) {
      prompted.push({
        id: `prompted_${p.color}_${idx}`,
        pieceId: 'V3',
        color: p.color,
        playerId: p.id,
        row: cfg.row,
        col: cfg.col,
        matrix: cfg.matrix,
        turnNumber: 0,
        timestamp: Date.now() - (players.length - idx) * 1000,
        styleClass: 'collaborative',
      });
    }
  });

  return prompted;
}

// Get all legal diagonal anchor cells where the player's color can attach pieces
export function getValidDiagonalAnchorPoints(
  board: BoardGrid,
  color: PlayerColor
): { row: number; col: number }[] {
  const isFirst = isPlayerFirstMove(board, color);
  if (isFirst) {
    const [sr, sc] = STARTING_CORNERS[color];
    return [{ row: sr, col: sc }];
  }

  const anchors: { row: number; col: number }[] = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] !== null) continue;

      // Check orthogonal edges: must NOT touch color
      const orthogonal = [
        [r - 1, c],
        [r + 1, c],
        [r, c - 1],
        [r, c + 1],
      ];
      let touchesEdge = false;
      for (const [or, oc] of orthogonal) {
        if (or >= 0 && or < BOARD_SIZE && oc >= 0 && oc < BOARD_SIZE) {
          if (board[or][oc] === color) {
            touchesEdge = true;
            break;
          }
        }
      }
      if (touchesEdge) continue;

      // Check diagonal corners: MUST touch at least one color
      const diagonal = [
        [r - 1, c - 1],
        [r - 1, c + 1],
        [r + 1, c - 1],
        [r + 1, c + 1],
      ];
      let touchesDiag = false;
      for (const [dr, dc] of diagonal) {
        if (dr >= 0 && dr < BOARD_SIZE && dc >= 0 && dc < BOARD_SIZE) {
          if (board[dr][dc] === color) {
            touchesDiag = true;
            break;
          }
        }
      }

      if (touchesDiag) {
        anchors.push({ row: r, col: c });
      }
    }
  }

  return anchors;
}

// Simple 3-Stage Progress Info
export function getGameplayStageInfo(piecesPlayedCount: number): import('../types/game').StageInfo {
  // 21 pieces total per player (or total pieces on board)
  if (piecesPlayedCount <= 6) {
    return {
      stageNumber: 1,
      name: 'Stage 1: Opening Foothold',
      tagline: 'Prompted Starters & Center Rush',
      advice: 'Starter tiles prompted on the board. Deploy your heavy 5-square pentominos outward while the board center is still open.',
      color: '#4f7bb6',
      progressPercent: Math.min(100, Math.round((piecesPlayedCount / 6) * 100)),
    };
  } else if (piecesPlayedCount <= 14) {
    return {
      stageNumber: 2,
      name: 'Stage 2: Strategic Crossroad',
      tagline: 'Tactical Weave & Cutoffs',
      advice: 'Slip through opponent chokepoints using diagonal bridges. Place medium 3-4 square tiles and save the 1-square Monomino!',
      color: '#4e9a7e',
      progressPercent: Math.min(100, Math.round(((piecesPlayedCount - 6) / 8) * 100)),
    };
  } else {
    return {
      stageNumber: 3,
      name: 'Stage 3: Maximum Points Endgame',
      tagline: 'Precision Squeeze to 109 Pts',
      advice: 'Fit remaining tiles into tight crevices. Save your 1-square Monomino for the final 21st move (+20 bonus for max points)!',
      color: '#c99648',
      progressPercent: Math.min(100, Math.round(((piecesPlayedCount - 14) / 7) * 100)),
    };
  }
}

// Generate pre-prompted starter tiles covering starting corners for all players
export function getPromptedStarterMoves(players: import('../types/game').Player[]): import('../types/game').PlacedPiece[] {
  const starterMoves: import('../types/game').PlacedPiece[] = [];

  // Corner definitions with symmetric L4 piece covering starting corner:
  // Blue: [0, 0] -> L4 at (0, 0)
  // Yellow: [0, 19] -> L4 flipped horizontally at (0, 18)
  // Red: [19, 19] -> L4 rotated 180 at (17, 18)
  // Green: [19, 0] -> L4 rotated at (17, 0)
  const configs: Record<PlayerColor, { row: number; col: number; matrix: number[][] }> = {
    blue: {
      row: 0,
      col: 0,
      matrix: [
        [1, 0],
        [1, 0],
        [1, 1],
      ],
    },
    yellow: {
      row: 0,
      col: 18,
      matrix: [
        [0, 1],
        [0, 1],
        [1, 1],
      ],
    },
    red: {
      row: 17,
      col: 18,
      matrix: [
        [1, 1],
        [0, 1],
        [0, 1],
      ],
    },
    green: {
      row: 17,
      col: 0,
      matrix: [
        [1, 1],
        [1, 0],
        [1, 0],
      ],
    },
  };

  players.forEach((p, idx) => {
    const cfg = configs[p.color];
    if (cfg) {
      starterMoves.push({
        id: `starter_${p.color}_${idx}`,
        pieceId: 'L4',
        color: p.color,
        playerId: p.id,
        row: cfg.row,
        col: cfg.col,
        matrix: cfg.matrix,
        turnNumber: 0,
        timestamp: Date.now() - (players.length - idx) * 100,
        styleClass: 'collaborative',
      });
    }
  });

  return starterMoves;
}

