// browser-sat.js
// Simple DPLL SAT solver with single-solution and all-solutions variants.

// Find all solutions. Returns an array of assignments.
// Each assignment is an array assignment[v] in {-1, 0, 1}, v = 1..numVars.
export function solveAll(clauses, numVars, limit = Infinity) {
  const results = [];
  const assignment = new Array(numVars + 1).fill(0); // 0 = unassigned

  function dpllAll(localClauses) {
    if (results.length >= limit) return;

    // Unit propagation
    let [cnf, asg, conflict] = unitPropagate(localClauses, assignment);
    if (conflict) return;

    if (cnf.length === 0) {
      // All clauses satisfied: record this assignment
      results.push(asg.slice());
      return;
    }

    // Choose an unassigned variable
    const v = chooseVar(cnf, asg, numVars);
    if (v === -1) return; // no unassigned var, but cnf not empty -> UNSAT

    // Try v = true
    {
      const asgTrue = asg.slice();
      asgTrue[v] = 1;
      const cnfTrue = simplify(cnf, v);
      dpllAll(cnfTrue, asgTrue);
      if (results.length >= limit) return;
    }

    // Try v = false
    {
      const asgFalse = asg.slice();
      asgFalse[v] = -1;
      const cnfFalse = simplify(cnf, -v);
      dpllAll(cnfFalse, asgFalse);
      if (results.length >= limit) return;
    }
  }

  dpllAll(clauses);
  return results;
}

// Single solution helper: returns one assignment or null.
export function solveOne(clauses, numVars) {
  const sols = solveAll(clauses, numVars, 1);
  return sols.length > 0 ? sols[0] : null;
}

/******************** DPLL Utilities ********************/

// Simplify CNF given a literal lit set to true.
function simplify(clauses, lit) {
  const newClauses = [];
  const neg = -lit;

  for (const clause of clauses) {
    if (clause.includes(lit)) {
      // Clause is satisfied; drop it
      continue;
    }
    if (clause.includes(neg)) {
      // Remove the falsified literal
      const reduced = clause.filter(x => x !== neg);
      if (reduced.length === 0) {
        // Empty clause => immediate conflict in that branch, but we
        // handle conflicts in unitPropagate / DPLL, so keep it.
        newClauses.push(reduced);
      } else {
        newClauses.push(reduced);
      }
    } else {
      // Clause unchanged
      newClauses.push(clause.slice());
    }
  }

  return newClauses;
}

// Unit propagation: repeatedly apply unit clauses.
// Returns [newClauses, newAssignment, conflictFlag].
function unitPropagate(clauses, assignment) {
  const asg = assignment.slice();
  let cnf = clauses.map(c => c.slice());

  while (true) {
    let unit = null;
    for (const clause of cnf) {
      if (clause.length === 0) {
        // Conflict
        return [cnf, asg, true];
      }
      if (clause.length === 1) {
        unit = clause[0];
        break;
      }
    }
    if (unit === null) break;

    const v = Math.abs(unit);
    const val = unit > 0 ? 1 : -1;

    if (asg[v] !== 0 && asg[v] !== val) {
      // Contradiction with existing assignment
      return [cnf, asg, true];
    }

    asg[v] = val;
    cnf = simplify(cnf, unit);
  }

  return [cnf, asg, false];
}

// Choose an unassigned variable from clauses.
function chooseVar(clauses, assignment, numVars) {
  // First try scanning clauses
  for (const clause of clauses) {
    for (const lit of clause) {
      const v = Math.abs(lit);
      if (v >= 1 && v <= numVars && assignment[v] === 0) {
        return v;
      }
    }
  }
  // Fallback: scan linearly
  for (let v = 1; v <= numVars; v++) {
    if (assignment[v] === 0) return v;
  }
  return -1;
}

