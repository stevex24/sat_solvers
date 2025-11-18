// browser-sat.js
// Minimal DPLL solver used by sudoku-app.js

export function solveOne(clauses, numVars) {
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

  return dfs() ? assignment : null;
}

