// sudoku-encode.js
// Full correct Sudoku → CNF encoder for the browser

export function sudokuToCNF(grid) {
  const clauses = [];
  const numVars = 9 * 9 * 9;   // 729 variables (we use 111..999 form)

  // Encoding:
  // V(r, c, d) = 100*r + 10*c + d
  function V(r, c, d) {
    return 100 * r + 10 * c + d;
  }

  //////////////////////////////////////////////////////
  // 1. Each cell has EXACTLY one digit (1–9)
  //////////////////////////////////////////////////////

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {

      // At least one digit
      const atleast = [];
      for (let d = 1; d <= 9; d++) {
        atleast.push(V(r, c, d));
      }
      clauses.push(atleast);

      // At most one digit
      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-V(r, c, d1), -V(r, c, d2)]);
        }
      }
    }
  }

  //////////////////////////////////////////////////////
  // 2. Each digit appears once per row
  //////////////////////////////////////////////////////

  for (let r = 1; r <= 9; r++) {
    for (let d = 1; d <= 9; d++) {

      // At least one spot in row r has digit d
      const atleast = [];
      for (let c = 1; c <= 9; c++) {
        atleast.push(V(r, c, d));
      }
      clauses.push(atleast);

      // At most one spot
      for (let c1 = 1; c1 <= 9; c1++) {
        for (let c2 = c1 + 1; c2 <= 9; c2++) {
          clauses.push([-V(r, c1, d), -V(r, c2, d)]);
        }
      }
    }
  }

  //////////////////////////////////////////////////////
  // 3. Each digit appears once per column
  //////////////////////////////////////////////////////

  for (let c = 1; c <= 9; c++) {
    for (let d = 1; d <= 9; d++) {

      // At least once
      const atleast = [];
      for (let r = 1; r <= 9; r++) {
        atleast.push(V(r, c, d));
      }
      clauses.push(atleast);

      // At most once
      for (let r1 = 1; r1 <= 9; r1++) {
        for (let r2 = r1 + 1; r2 <= 9; r2++) {
          clauses.push([-V(r1, c, d), -V(r2, c, d)]);
        }
      }
    }
  }

  //////////////////////////////////////////////////////
  // 4. Each digit appears once per 3×3 box
  //////////////////////////////////////////////////////

  for (let boxR = 0; boxR < 3; boxR++) {
    for (let boxC = 0; boxC < 3; boxC++) {

      for (let d = 1; d <= 9; d++) {

        const atleast = [];

        // Collect cells in this 3x3 box
        const cells = [];
        for (let r = 1 + boxR * 3; r <= 3 + boxR * 3; r++) {
          for (let c = 1 + boxC * 3; c <= 3 + boxC * 3; c++) {
            cells.push([r, c]);
            atleast.push(V(r, c, d));
          }
        }

        clauses.push(atleast);

        // At most one
        for (let i = 0; i < cells.length; i++) {
          for (let j = i + 1; j < cells.length; j++) {
            const [r1, c1] = cells[i];
            const [r2, c2] = cells[j];
            clauses.push([
              -V(r1, c1, d),
              -V(r2, c2, d)
            ]);
          }
        }
      }
    }
  }

  //////////////////////////////////////////////////////
  // 5. Encode the GIVEN CLUES from the puzzle
  //////////////////////////////////////////////////////

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val !== 0) {
        // Force V(r+1, c+1, val)
        clauses.push([V(r + 1, c + 1, val)]);
      }
    }
  }

  return { clauses, numVars };
}

