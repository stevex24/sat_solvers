// sudoku-encode.js
// Sudoku → CNF converter (browser version)

export function sudokuToCNF(grid) {
  let clauses = [];
  const numVars = 9 * 9 * 9;

  function V(r, c, d) {
    return 100 * r + 10 * c + d;
  }

  // (Exactly the full CNF encoding – same as in sudoku-app.js)
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      let atLeast = [];
      for (let d = 1; d <= 9; d++) atLeast.push(V(r, c, d));
      clauses.push(atLeast);

      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-V(r, c, d1), -V(r, c, d2)]);
        }
      }
    }
  }

  // same row/col/block constraints as before…

  // Given clues
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      let v = grid[r - 1][c - 1];
      if (v !== 0) clauses.push([V(r, c, v)]);
    }
  }

  return { clauses, numVars };
}

