(function (global) {
  "use strict";

  /**
   * tinySatSolve
   * -------------
   * A simple DPLL-based SAT solver with unit propagation.
   *
   * @param {number[][]} clauses - CNF as array of clauses, each clause is array of ints
   *                               positive literal: variable index
   *                               negative literal: -variable index
   * @param {number} numVars - number of variables (highest var index)
   * @returns {number[] | null} assignment array of length numVars+1
   *          where assignment[v] = 1 (true), -1 (false), or 0 (unassigned)
   */
  function tinySatSolve(clauses, numVars) {
    const assignment = new Array(numVars + 1);
    for (let i = 0; i <= numVars; i++) assignment[i] = 0;

    const ok = dpll(clauses, assignment);
    return ok ? assignment : null;
  }

  /**
   * Unit propagation:
   * Repeatedly enforce unit clauses until no more changes or a conflict is found.
   *
   * @returns {boolean} true if consistent, false if a conflict was detected.
   */
  function unitPropagate(clauses, assignment) {
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

      if (!changed) {
        return true;
      }
    }
  }

  /**
   * Core DPLL with a very simple variable choice heuristic:
   * pick the first unassigned variable.
   */
  function dpll(clauses, assignment) {
    // First, propagate all forced assignments.
    if (!unitPropagate(clauses, assignment)) {
      return false;
    }

    // Check if all clauses are satisfied.
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
        } else {
          // Clause is not yet decided; can't say it's false.
          continue;
        }
      }

      if (!clauseSatisfied) {
        allSatisfied = false;
        break outer;
      }
    }

    if (allSatisfied) {
      return true;
    }

    // Choose the first unassigned variable.
    let v = 0;
    for (let i = 1; i < assignment.length; i++) {
      if (assignment[i] === 0) {
        v = i;
        break;
      }
    }

    if (v === 0) {
      // No unassigned variables left, but not all clauses satisfied => unsat
      return false;
    }

    // Try v = true
    assignment[v] = 1;
    if (dpll(clauses, assignment)) {
      return true;
    }

    // Backtrack and try v = false
    assignment[v] = -1;
    if (dpll(clauses, assignment)) {
      return true;
    }

    // Backtrack further
    assignment[v] = 0;
    return false;
  }

  // Export globals for browser
  global.tinySatSolve = tinySatSolve;

  /**
   * A convenient wrapper so sudoku-app.js can call window.solveSAT(cnf)
   * where cnf = { clauses: number[][], numVars: 729 }
   *
   * Returns:
   *   {
   *      model: 9x9 number[][] | null,
   *      assignment: number[] | null
   *   }
   */
  global.solveSAT = function (cnf) {
    const assignment = tinySatSolve(cnf.clauses, cnf.numVars);
    if (!assignment) return null;

    // Convert assignment → 9×9 board using the encoder's decoder if available.
    if (typeof global.decodeSudokuFromAssignment === "function") {
      try {
        const model = global.decodeSudokuFromAssignment(assignment);
        return { model, assignment };
      } catch (e) {
        console.error("Decoding failed:", e);
      }
    }

    // If decoder isn't available, return raw assignment.
    return { model: null, assignment };
  };
})(this);
