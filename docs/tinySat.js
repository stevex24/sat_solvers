(function (global) {
  "use strict";

  /**
   * tinySatSolve
   * -------------
   * @param {number[][]} clauses - CNF as array of clauses, each clause is array of ints
   *                               positive literal: variable index
   *                               negative literal: -variable index
   * @param {number} numVars - number of variables (highest var index)
   * @returns {number[] | null} assignment array of length numVars+1
   *          where assignment[v] = 1 (true), -1 (false), or 0 (unused)
   */
  function tinySatSolve(clauses, numVars) {
    const assignment = new Array(numVars + 1);
    for (let i = 0; i <= numVars; i++) assignment[i] = 0;

    const ok = dpll(clauses, assignment);
    return ok ? assignment : null;
  }

  /**
   * Core DPLL with unit propagation. No fancy heuristics, but fine for Sudoku.
   */
  function dpll(clauses, assignment) {
    // Unit propagation loop
    while (true) {
      let changed = false;

      for (let i = 0; i < clauses.length; i++) {
        const clause = clauses[i];
        let clauseSatisfied = false;
        let numUnassigned = 0;
        let lastUnassignedLit = 0;

        for (let j = 0; j < clause.length; j++) {
          const lit = clause[j];
          const v = Math.abs(lit);
          const val = assignment[v];

          if (val === 0) {
            numUnassigned++;
            lastUnassignedLit = lit;
          } else {
            // Is this literal satisfied?
            if ((val === 1 && lit > 0) || (val === -1 && lit < 0)) {
              clauseSatisfied = true;
              break;
            }
          }
        }

        if (!clauseSatisfied) {
          if (numUnassigned === 0) {
            // Clause is unsatisfied under current assignment
            return false;
          }

          if (numUnassigned === 1) {
            // Unit clause: enforce literal
            const v = Math.abs(lastUnassignedLit);
            const implied = lastUnassignedLit > 0 ? 1 : -1;
            const cur = assignment[v];

            if (cur === 0) {
              assignment[v] = implied;
              changed = true;
            } else if (cur !== implied) {
              // Contradiction
              return false;
            }
          }
        }
      }

      if (!changed) break;
    }

    // Check if all clauses are satisfied
    let allSatisfied = true;
    outer: for (let i = 0; i < clauses.length; i++) {
      const clause = clauses[i];
      let clauseSatisfied = false;

      for (let j = 0; j < clause.length; j++) {
        const lit = clause[j];
        const v = Math.abs(lit);
        const val = assignment[v];

        if (val !== 0) {
          if ((val === 1 && lit > 0) || (val === -1 && lit < 0)) {
            clauseSatisfied = true;
            break;
          }
        }
      }

      if (!clauseSatisfied) {
        allSatisfied = false;
        break outer;
      }
    }

    if (allSatisfied) return true;

    // Choose first unassigned variable and branch
    let varToAssign = 0;
    for (let v = 1; v < assignment.length; v++) {
      if (assignment[v] === 0) {
        varToAssign = v;
        break;
      }
    }

    if (varToAssign === 0) {
      // Should normally mean all clauses are satisfied already
      return true;
    }

    const saved = assignment.slice();

    // Try true
    assignment[varToAssign] = 1;
    if (dpll(clauses, assignment)) return true;

    // Backtrack and try false
    for (let i = 0; i < assignment.length; i++) assignment[i] = saved[i];
    assignment[varToAssign] = -1;
    if (dpll(clauses, assignment)) return true;

    // Backtrack to saved state and fail
    for (let i = 0; i < assignment.length; i++) assignment[i] = saved[i];
    return false;
  }

  // Export
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { tinySatSolve };
  } else {
    global.tinySatSolve = tinySatSolve;
  }
})(this);

