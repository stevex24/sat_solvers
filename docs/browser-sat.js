// docs/browser-sat.js
// Simple DPLL SAT solver for the browser.

function unitPropagate(clauses, assignment) {
  const asg = assignment.slice();
  let cnf = clauses.map(c => c.slice());

  while (true) {
    let unit = null;

    for (const clause of cnf) {
      if (clause.length === 0) {
        return { conflict: true };
      }
      if (clause.length === 1) {
        unit = clause[0];
        break;
      }
    }

    if (!unit) break;

    const v = Math.abs(unit);
    const val = unit > 0 ? 1 : -1;

    if (asg[v] !== 0 && asg[v] !== val) {
      return { conflict: true };
    }

    asg[v] = val;
    cnf = simplify(cnf, unit);
  }

  return { conflict: false, clauses: cnf, assignment: asg };
}

function simplify(clauses, lit) {
  const newClauses = [];
  const neg = -lit;

  for (const clause of clauses) {
    if (clause.includes(lit)) continue; // satisfied
    if (clause.includes(neg)) {
      const reduced = clause.filter(x => x !== neg);
      newClauses.push(reduced);
    } else {
      newClauses.push(clause.slice());
    }
  }

  return newClauses;
}

function chooseVar(clauses, assignment, numVars) {
  for (const clause of clauses) {
    for (const lit of clause) {
      const v = Math.abs(lit);
      if (assignment[v] === 0) return v;
    }
  }
  return -1;
}

function dpll(clauses, assignment, numVars, solutions, limit) {
  if (limit !== undefined && solutions.length >= limit) return;

  const { conflict, clauses: cnf, assignment: asg } =
    unitPropagate(clauses, assignment);
  if (conflict) return;

  if (!cnf || cnf.length === 0) {
    solutions.push(asg.slice());
    return;
  }

  const v = chooseVar(cnf, asg, numVars);
  if (v === -1) return;

  // Try v = TRUE
  {
    const asgTrue = asg.slice();
    asgTrue[v] = 1;
    dpll(simplify(cnf, v), asgTrue, numVars, solutions, limit);
    if (limit !== undefined && solutions.length >= limit) return;
  }

  // Try v = FALSE
  {
    const asgFalse = asg.slice();
    asgFalse[v] = -1;
    dpll(simplify(cnf, -v), asgFalse, numVars, solutions, limit);
  }
}

export function solveOne(clauses, numVars) {
  const solutions = [];
  const assignment = new Array(numVars + 1).fill(0);
  dpll(clauses, assignment, numVars, solutions, 1);
  return solutions.length ? solutions[0] : null;
}

export function solveAll(clauses, numVars, limit = Infinity) {
  const solutions = [];
  const assignment = new Array(numVars + 1).fill(0);
  dpll(clauses, assignment, numVars, solutions, limit);
  return solutions;
}

