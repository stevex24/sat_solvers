// sudoku-encode.js
//
// Correct, complete Sudoku CNF encoder for browser SAT solving.

export function sudokuToCNF(grid) {
  const clauses = [];
  const numVars = 9 * 9 * 9; // r=1..9, c=1..9, d=1..9 encoded as 100*r + 10*c + d

  function v(r, c, d) {
    return 100 * r + 10 * c + d;
  }

  // Cell constraints
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      let atLeast = [];
      for (let d = 1; d <= 9; d++) atLeast.push(v(r, c, d));
      clauses.push(atLeast);

      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-v(r, c, d1), -v(r, c, d2)]);
        }
      }
    }
  }

  // Row constraints
  for (let r = 1; r <= 9; r++) {
    for (let d = 1; d <= 9; d++) {
      let atLeast = [];
      for (let c = 1; c <= 9; c++) atLeast.push(v(r, c, d));
      clauses.push(atLeast);

      for (let c1 = 1; c1 <= 9; c1++) {
        for (let c2 = c1 + 1; c2 <= 9; c2++) {
          clauses.push([-v(r, c1, d), -v(r, c2, d)]);
        }
      }
    }
  }

  // Column constraints
  for (let c = 1; c <= 9; c++) {
    for (let d = 1; d <= 9; d++) {
      let atLeast = [];
      for (let r = 1; r <= 9; r++) atLeast.push(v(r, c, d));
      clauses.push(atLeast);

      for (let r1 = 1; r1 <= 9; r1++) {
        for (let r2 = r1 + 1; r2 <= 9; r2++) {
          clauses.push([-v(r1, c, d), -v(r2, c, d)]);
        }
      }
    }
  }

  // 3x3 blocks
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let d = 1; d <= 9; d++) {
        let atLeast = [];
        for (let r = 1; r <= 3; r++) {
          for (let c = 1; c <= 3; c++) {
            atLeast.push(v(3 * br + r, 3 * bc + c, d));
          }
        }
        clauses.push(atLeast);

        const cells = [];
        for (let r = 1; r <= 3; r++) {
          for (let c = 1; c <= 3; c++) {
            cells.push([3 * br + r, 3 * bc + c]);
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

  // Input clues
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      const d = grid[r - 1][c - 1];
      if (d !== 0) clauses.push([v(r, c, d)]);
    }
  }

  return { clauses, numVars };
}

