import { PieceDef } from '../types/game';

// All 21 standard Blokus Polyomino pieces
export const ALL_PIECES: PieceDef[] = [
  // 1 Monomino (1 square)
  {
    id: 'I1',
    name: 'Monomino',
    size: 1,
    matrix: [[1]],
  },

  // 1 Domino (2 squares)
  {
    id: 'I2',
    name: 'Domino',
    size: 2,
    matrix: [
      [1],
      [1],
    ],
  },

  // 2 Triominos (3 squares)
  {
    id: 'I3',
    name: 'Triomino I',
    size: 3,
    matrix: [
      [1],
      [1],
      [1],
    ],
  },
  {
    id: 'V3',
    name: 'Triomino V',
    size: 3,
    matrix: [
      [1, 0],
      [1, 1],
    ],
  },

  // 5 Tetrominos (4 squares)
  {
    id: 'I4',
    name: 'Tetromino I',
    size: 4,
    matrix: [
      [1],
      [1],
      [1],
      [1],
    ],
  },
  {
    id: 'L4',
    name: 'Tetromino L',
    size: 4,
    matrix: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'T4',
    name: 'Tetromino T',
    size: 4,
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
  {
    id: 'O4',
    name: 'Tetromino Square',
    size: 4,
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },
  {
    id: 'Z4',
    name: 'Tetromino Z',
    size: 4,
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },

  // 12 Pentominos (5 squares)
  {
    id: 'F5',
    name: 'Pentomino F',
    size: 5,
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    id: 'I5',
    name: 'Pentomino I',
    size: 5,
    matrix: [
      [1],
      [1],
      [1],
      [1],
      [1],
    ],
  },
  {
    id: 'L5',
    name: 'Pentomino L',
    size: 5,
    matrix: [
      [1, 0],
      [1, 0],
      [1, 0],
      [1, 1],
    ],
  },
  {
    id: 'P5',
    name: 'Pentomino P',
    size: 5,
    matrix: [
      [1, 1],
      [1, 1],
      [1, 0],
    ],
  },
  {
    id: 'N5',
    name: 'Pentomino N',
    size: 5,
    matrix: [
      [0, 1],
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  },
  {
    id: 'T5',
    name: 'Pentomino T',
    size: 5,
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
  },
  {
    id: 'U5',
    name: 'Pentomino U',
    size: 5,
    matrix: [
      [1, 0, 1],
      [1, 1, 1],
    ],
  },
  {
    id: 'V5',
    name: 'Pentomino V',
    size: 5,
    matrix: [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1],
    ],
  },
  {
    id: 'W5',
    name: 'Pentomino W',
    size: 5,
    matrix: [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  {
    id: 'X5',
    name: 'Pentomino X (Cross)',
    size: 5,
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
  {
    id: 'Y5',
    name: 'Pentomino Y',
    size: 5,
    matrix: [
      [0, 1],
      [1, 1],
      [0, 1],
      [0, 1],
    ],
  },
  {
    id: 'Z5',
    name: 'Pentomino Z',
    size: 5,
    matrix: [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
  },
];

// Rotate matrix clockwise 90 degrees
export function rotateMatrixClockwise(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = [];
  for (let c = 0; c < cols; c++) {
    result[c] = [];
    for (let r = rows - 1; r >= 0; r--) {
      result[c].push(matrix[r][c]);
    }
  }
  return result;
}

// Flip matrix horizontally
export function flipMatrixHorizontal(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row].reverse());
}

// Flip matrix vertically
export function flipMatrixVertical(matrix: number[][]): number[][] {
  return [...matrix].reverse();
}

// Get all unique variations (rotations and flips) of a piece matrix
export function getAllPieceVariations(matrix: number[][]): number[][][] {
  const variations: number[][][] = [];
  const stringified = new Set<string>();

  let curr = matrix;
  for (let flip = 0; flip < 2; flip++) {
    for (let rot = 0; rot < 4; rot++) {
      const key = curr.map((r) => r.join('')).join('|');
      if (!stringified.has(key)) {
        stringified.add(key);
        variations.push(curr);
      }
      curr = rotateMatrixClockwise(curr);
    }
    curr = flipMatrixHorizontal(matrix);
  }

  return variations;
}
