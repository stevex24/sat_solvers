// sudoku-app.js
// Complete working browser Sudoku SAT solver (no counting version)
// Includes full CNF encoding, UI code, and a small DPLL SAT solver.

//////////////////////////////////////////////////////
// Build the 9x9 input grid
//////////////////////////////////////////////////////

function buildGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const input = document.createElement("input");
      input.maxLength = 1;
      input.dataset.row = r;
      input.dataset.col = c;
      grid.appendChild(input);
    }
  }
}

//////////////////////////////////////////////////////
// Read the grid into a 2D numeric array
//////////////////////////////////////////////////////

function readGrid() {
  const cells = document.querySelectorAll("#grid input");
  let grid = [];
  let k = 0;

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let v = cells[k++].value.trim();
      if (v === "" || v === "." || v === "0") row.push(0);
      else row.push(parseInt(v));
    }
    grid.push(row);
  }
  return grid;
}

//////////////////////////////////////////////////////
// SAT solver (small recursive DPLL)
//////////////////////////////////////////////////////

function solveSAT(clauses, numVars) {
  let assignment = new Array(numVars + 1).fill(0);

  function valueLit(lit) {
    let v = Math.abs(lit);
    let s = assignment[v];
    if (s === 0) return undefined;
    return (lit > 0 ? s === 1 : s === -1);
  }

  function dfs() {
    for (let clause of clauses) {
      let satisfied = false;
      let undecided = false;

      for (let lit of clause) {
        let v = valueLit(lit);
        if (v === true) { satisfied = true; break; }
        if (v === undefined) undecided = true;
      }
      if (!satisfied && !undecided) return false;
    }

    let v = assignment.indexOf(0);
    if (v === -1) return true;

    assignment[v] = 1;
    if (dfs()) return true;

    assignment[v] = -1;
    if (dfs()) return true;

    assignment[v] = 0;
    return false;
  }

  if (dfs()) return assignment;
  return null;
}

//////////////////////////////////////////////////////
// FULL Sudoku CNF encoding
//////////////////////////////////////////////////////

function sudokuToCNF(grid) {
  let clauses = [];
  const numVars = 9 * 9 * 9;

  // Variable encoding: V(r,c,d) = 100r + 10c + d
  function V(r, c, d) {
    return 100 * r + 10 * c + d;
  }

  // -------------------------------
  // 1. Each cell contains exactly one digit
  // -------------------------------
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {

      // At least one digit
      let atLeast = [];
      for (let d = 1; d <= 9; d++) atLeast.push(V(r, c, d));
      clauses.push(atLeast);

      // At most one digit
      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-V(r, c, d1), -V(r, c, d2)]);
        }
      }
    }
  }

  // -------------------------------
  // 2. Each digit appears once per row
  // -------------------------------
  for (let r = 1; r <= 9; r++) {
    for (let d = 1; d <= 9; d++) {

      // At least one cell in row has digit d
      let rowClause = [];
      for (let c = 1; c <= 9; c++) rowClause.push(V(r, c, d));
      clauses.push(rowClause);

      // At most one cell in row has digit d
      for (let c1 = 1; c1 <= 9; c1++) {
        for (let c2 = c1 + 1; c2 <= 9; c2++) {
          clauses.push([-V(r, c1, d), -V(r, c2, d)]);
        }
      }
    }
  }

  // -------------------------------
  // 3. Each digit appears once per column
  // -------------------------------
  for (let c = 1; c <= 9; c++) {
    for (let d = 1; d <= 9; d++) {

      // At least once
      let colClause = [];
      for (let r = 1; r <= 9; r++) col

