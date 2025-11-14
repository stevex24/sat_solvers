// browser-sat.js

export function solveOne(clauses, numVars) {
  return dpll(clauses, new Array(numVars+1).fill(0));
}

export function solveAll(clauses, numVars, limit = Infinity) {
  let solutions = [];
  let assign = new Array(numVars+1).fill(0);

  function search(cls) {
    if (solutions.length >= limit) return;
    let sol = dpll(cls, assign);
    if (sol) {
      solutions.push(sol.slice());
      // Block this solution
      let block = [];
      for (let v = 1; v <= numVars; v++) {
        if (sol[v] === 1) block.push(-v);
        else block.push(v);
      }
      let newCls = cls.concat([block]);
      search(newCls);
    }
  }

  search(clauses);
  return solutions;
}

function dpll(clauses, assignment) {
  while (true) {
    let unit = findUnit(clauses);
    if (!unit) break;
    propagate(unit, clauses, assignment);
  }

  if (clauses.some(cl => cl.length === 0)) return null;

  if (clauses.length === 0) return assignment.slice();

  let v = chooseVar(clauses, assignment);

  let saved = saveClauses(clauses);

  assignment[v] = 1;
  let cls1 = simplifyClauses(saved, v);
  let r1 = dpll(cls1, assignment);
  if (r1) return r1;

  assignment[v] = -1;
  let cls2 = simplifyClauses(saved, -v);
  let r2 = dpll(cls2, assignment);
  if (r2) return r2;

  assignment[v] = 0;
  return null;
}

function findUnit(clauses) {
  for (let c of clauses) if (c.length === 1) return c[0];
  return null;
}

function propagate(lit, clauses, assignment) {
  let v = Math.abs(lit);
  assignment[v] = lit > 0 ? 1 : -1;
}

function chooseVar(clauses, assignment) {
  for (let c of clauses) {
    for (let lit of c) {
      if (assignment[Math.abs(lit)] === 0) return Math.abs(lit);
    }
  }
  return 1;
}

function saveClauses(cls) {
  return cls.map(c => c.slice());
}

function simplifyClauses(cls, lit) {
  let v = Math.abs(lit);
  return cls
    .map(c => c.slice())
    .filter(c => !c.includes(lit))
    .map(c => c.filter(x => x !== -lit));
}

