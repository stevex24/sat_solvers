// docs/sudoku-encode.js
// Encode a 9x9 Sudoku grid into CNF.
// Variable encoding: v(r, c, d) = 100*r + 10*c + d, each in 1..9.

function v(r, c, d) {
  return 100 * r + 10 * c + d;
}

export function sudokuToCNF(grid) {
  const clauses = [];

  // 1. Each cell has at least one number.
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      const cellClause = [];
      for (let d = 1; d <= 9; d++) {
        cellClause.push(v(r, c, d));
      }
      clauses.push(cellClause);
    }
  }

  // 2. Each cell has at most one number (pairwise).
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-v(r, c, d1), -v(r, c, d2)]);
        }
      }
    }
  }

  // 3. Each number appears at most once per row.
  for (let r = 1; r <= 9; r++) {
    for (let d = 1; d <= 9; d++) {
      for (let c1 = 1; c1 <= 9; c1++) {
        for (let c2 = c1 + 1; c2 <= 9; c2++) {
          clauses.push([-v(r, c1, d), -v(r, c2, d)]);
        }
      }
    }
  }

  // 4. Each number appears at most once per column.
  for (let c = 1; c <= 9; c++) {
    for (let d = 1; d <= 9; d++) {
      for (let r1 = 1; r1 <= 9; r1++) {
        for (let r2 = r1 + 1; r2 <= 9; r2++) {
          clauses.push([-v(r1, c, d), -v(r2, c, d)]);
        }
      }
    }
  }

  // 5. Each number appears at most once per 3x3 block.
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let d = 1; d <= 9; d++) {
        const cells = [];
        for (let dr = 1; dr <= 3; dr++) {
          for (let dc = 1; dc <= 3; dc++) {
            const r = 3 * br + dr;
            const c = 3 * bc + dc;
            cells.push([r, c]);
          }
        }
        for (let i = 0; i < cells.length; i++) {
          for (let j = i + 1; j < cells.length; j++) {
            const [r1, c1] = cells[i];
            const [r2, c2] = cells[j];
            clauses.push([-v(r1, c1, d), -v(r2, c2, d)]);
          }
        }
      }
    }
  }

  // 6. Encode given clues from the grid.
  // grid[r-1][c-1] = 0 for blank, or 1..9 for a clue.
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      const val = grid[r - 1][c - 1];
      if (val >= 1 && val <= 9) {
        clauses.push([v(r, c, val)]);
      }
    }
  }

  // Maximum variable index with this scheme is 999.
  const numVars = 999;
  return { clauses, numVars };
}

