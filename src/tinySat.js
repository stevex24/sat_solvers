// tinySat.js
// A small DPLL-style SAT solver for CNF formulas.
// CNF format: array of clauses; each clause: array of integers.
// Variables are positive integers 1..numVars; negative ints for negated literals.

function simplify(clauses, assignment) {
  const newClauses = [];

  for (const clause of clauses) {
    let satisfied = false;
    const newClause = [];

    for (const lit of clause) {
      const v = Math.abs(lit);
      const val = assignment[v]; // 0 = unassigned, 1 = true, -1 = false

      if (val === 0) {
        // literal is unassigned, keep for now
        newClause.push(lit);
      } else {
        // literal is assigned
        if ((lit > 0 && val === 1) || (lit < 0 && val === -1)) {
          // clause is already true
          satisfied = true;
          break;
        } else {
          // literal is false, drop it
          // do nothing
        }
      }
    }

    if (satisfied) {
      continue; // clause is true, skip it
    }

    if (newClause.length === 0) {
      // clause is empty => conflict
      return { unsat: true, clauses: [] };
    }

    newClauses.push(newClause);
  }

  return { unsat: false, clauses: newClauses };
}

function unitPropagate(clauses, assignment) {
  while (true) {
    let unitLit = null;

    for (const clause of clauses) {
      if (clause.length === 1) {
        unitLit = clause[0];
        break;
      }
    }

    if (unitLit === null) {
      break; // no more unit clauses
    }

    const v = Math.abs(unitLit);
    const val = unitLit > 0 ? 1 : -1;

    if (assignment[v] !== 0 && assignment[v] !== val) {
      // conflict: variable already assigned with opposite value
      return { unsat: true, clauses: [] };
    }

    assignment[v] = val;
    const res = simplify(clauses, assignment);
    if (res.unsat) {
      return { unsat: true, clauses: [] };
    }
    clauses = res.clauses;
  }

  return { unsat: false, clauses, assignment };
}

function chooseVariable(clauses, assignment, numVars) {
  // naive: first unassigned variable that appears in any clause
  const present = new Array(numVars + 1).fill(false);

  for (const clause of clauses) {
    for (const lit of clause) {
      const v = Math.abs(lit);
      present[v] = true;
    }
  }

  for (let v = 1; v <= numVars; v++) {
    if (present[v] && assignment[v] === 0) {
      return v;
    }
  }
  return null;
}

function dpll(clauses, assignment, numVars) {
  const up = unitPropagate(clauses, assignment);
  if (up.unsat) return null;

  clauses = up.clauses;
  assignment = up.assignment;

  if (clauses.length === 0) {
    // all clauses satisfied
    return assignment;
  }

  const v = chooseVariable(clauses, assignment, numVars);
  if (v === null) {
    // no variable to choose but clauses not empty: stuck; treat as failure
    return null;
  }

  // Try v = true
  {
    const assign2 = assignment.slice();
    assign2[v] = 1;
    const res = simplify(clauses, assign2);
    if (!res.unsat) {
      const a = dpll(res.clauses, assign2, numVars);
      if (a !== null) return a;
    }
  }

  // Try v = false
  {
    const assign2 = assignment.slice();
    assign2[v] = -1;
    const res = simplify(clauses, assign2);
    if (!res.unsat) {
      const a = dpll(res.clauses, assign2, numVars);
      if (a !== null) return a;
    }
  }

  return null;
}

// Public function: returns boolean model array [0..numVars]
export function solveSAT(clauses, numVars) {
  const assignment = new Array(numVars + 1).fill(0); // 0 = unassigned
  const result = dpll(clauses, assignment, numVars);

  if (result === null) return null;

  const model = new Array(numVars + 1).fill(false);
  for (let v = 1; v <= numVars; v++) {
    model[v] = (result[v] === 1);
  }
  return model;
}

