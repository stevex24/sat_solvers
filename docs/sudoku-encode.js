// sudoku-encode.js

// variable numbering:
// cell (r,c) with digit d → number = 100*r + 10*c + d
function varNum(r, c, d) {
  return 100*r + 10*c + d;
}

// Convert a Sudoku grid (array of arrays) into CNF clauses
export function sudokuToCNF(grid) {
  let clauses = [];

  // 1. Each cell has at least one number
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      let clause = [];
      for (let d = 1; d <= 9; d++) {
        clause.push(varNum(r, c, d));
      }
      clauses.push(clause);
    }
  }

  // 2. Each cell has at most one number
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-varNum(r, c, d1), -varNum(r, c, d2)]);
        }
      }
    }
  }

  // 3. Row constraints
  for (let r = 1; r <= 9; r++) {
    for (let d = 1; d <= 9; d++) {
      for (let c1 = 1; c1 <= 9; c1++) {
        for (let c2 = c1 + 1; c2 <= 9; c2++) {
          clauses.push([-varNum(r, c1, d), -varNum(r, c2, d)]);
        }
      }
    }
  }

  // 4. Column constraints
  for (let c = 1; c <= 9; c++) {
    for (let d = 1; d <= 9; d++) {
      for (let r1 = 1; r1 <= 9; r1++) {
        for (let r2 = r1 + 1; r2 <= 9; r2++) {
          clauses.push([-varNum(r1, c, d), -varNum(r2, c, d)]);
        }
      }
    }
  }

  // 5. Block constraints
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let d = 1; d <= 9; d++) {
        let cells = [];
        for (let r = 1; r <= 3; r++) {
          for (let c = 1; c <= 3; c++) {
            cells.push([3*br + r, 3*bc + c]);
          }
        }
        for (let i = 0; i < cells.length; i++) {
          for (let j = i + 1; j < cells.length; j++) {
            let [r1, c1] = cells[i];
            let [r2, c2] = cells[j];
            clauses.push([
              -varNum(r1, c1, d),
              -varNum(r2, c2, d)
            ]);
          }
        }
      }
    }
  }

  // 6. Fixed clues
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const d = grid[r][c];
      if (d > 0) {
        clauses.push([varNum(r+1, c+1, d)]);
      }
    }
  }

  return { clauses, numVars: 999 };
}

