// browser-sat.js
// A tiny DPLL SAT solver (no counting mode)

export function solveOne(clauses, numVars) {
  const assignment = new Array(numVars + 1).fill(0);

  function val(lit) {
    const v = Math.abs(lit);
    const a = assignment[v];
    if (a === 0) return undefined;
    return lit > 0 ? a === 1 : a === -1;
  }

  function dfs() {
    // Check clauses
    for (let clause of clauses) {
      let ok = false, undec = false;
      for (let lit of clause) {
        const r = val(lit);
        if (r === true) { ok = true; break; }
        if (r === undefined) undec = true;
      }
      if (!ok && !undec) return false;
    }

    // Find next variable
    const v = assignment.indexOf(0);
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

