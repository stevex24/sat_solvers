// browser-sat.js
// Asynchronous non-blocking DPLL SAT solver for browser use.
//
// Exported API:
//   await solveOneAsync(clauses, numVars)
//   await solveAllAsync(clauses, numVars, limit)

//////////////////// Utility: Async Yield ////////////////////

function asyncYield() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

//////////////////// Unit Propagation ////////////////////

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
    if (clause.includes(lit)) continue;   // satisfied
    if (clause.includes(neg)) {
      const reduced = clause.filter(x => x !== neg);
      newClauses.push(reduced);
    } else {
      newClauses.push(clause.slice());
    }
  }

  return newClauses;
}

//////////////////// Variable Choice ////////////////////

function chooseVar(clauses, assignment, numVars) {
  for (const clause of clauses) {
    for (const lit of clause) {
      const v = Math.abs(lit);
      if (assignment[v] === 0) return v;
    }
  }
  return -1;
}

//////////////////// Async DPLL Core ////////////////////

async function dpllAsync(clauses, assignment, numVars, limit, results) {
  if (results.length >= limit) return;

  const { conflict, clauses: cnf, assignment: asg } =
    unitPropagate(clauses, assignment);
  if (conflict) return;

  if (!cnf || cnf.length === 0) {
    results.push(asg.slice());
    return;
  }

  // Yield control periodically to avoid freezing UI
  await asyncYield();

  const v = chooseVar(cnf, asg, numVars);
  if (v === -1) return;

  // Try v = TRUE
  {
    const asgTrue = asg.slice();
    asgTrue[v] = 1;
    await dpllAsync(simplify(cnf, v), asgTrue, numVars, limit, results);
    if (results.length >= limit) return;
  }

  // Try v = FALSE
  {
    const asgFalse = asg.slice();
    asgFalse[v] = -1;
    await dpllAsync(simplify(cnf, -v), asgFalse, numVars, limit, results);
  }
}

//////////////////// Public API ////////////////////

export async function solveOneAsync(clauses, numVars) {
  const results = [];
  await dpllAsync(clauses, new Array(numVars + 1).fill(0), numVars, 1, results);
  return results.length ? results[0] : null;
}

export async function solveAllAsync(clauses, numVars, limit = Infinity) {
  const results = [];
  await dpllAsync(clauses, new Array(numVars + 1).fill(0), numVars, limit, results);
  return results;
}

