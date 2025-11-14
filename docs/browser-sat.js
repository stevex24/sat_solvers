// browser-sat.js
//
// Tiny SAT solver with support for:
//  - solveOne(cnf, numVars)
//  - solveAll(cnf, numVars, limit)
//
// Variables are 1..numVars, clauses = array of arrays of ints.
// Example clause: [1, -3, 4]

export function solveOne(cnf, numVars) {
    const assignment = new Array(numVars + 1).fill(0); // 0 = unassigned

    function backtrack(idx) {
        if (idx > numVars) {
            return checkCNF(cnf, assignment) ? assignment.slice() : null;
        }
        if (assignment[idx] !== 0) return backtrack(idx + 1);

        assignment[idx] = 1;
        if (partialOK(cnf, assignment)) {
            const r = backtrack(idx + 1);
            if (r) return r;
        }

        assignment[idx] = -1;
        if (partialOK(cnf, assignment)) {
            const r = backtrack(idx + 1);
            if (r) return r;
        }

        assignment[idx] = 0;
        return null;
    }

    return backtrack(1);
}

export function solveAll(cnf, numVars, maxSolutions = Infinity) {
    const solutions = [];
    const assignment = new Array(numVars + 1).fill(0);

    function backtrack(idx) {
        if (solutions.length >= maxSolutions) return;

        if (idx > numVars) {
            if (checkCNF(cnf, assignment)) {
                solutions.push(assignment.slice());
            }
            return;
        }

        if (assignment[idx] !== 0) {
            backtrack(idx + 1);
            return;
        }

        assignment[idx] = 1;
        if (partialOK(cnf, assignment)) backtrack(idx + 1);

        assignment[idx] = -1;
        if (partialOK(cnf, assignment)) backtrack(idx + 1);

        assignment[idx] = 0;
    }

    backtrack(1);
    return solutions;
}

/*************** CNF Utilities ****************/

function checkCNF(cnf, a) {
    return cnf.every(cl => cl.some(lit => a[Math.abs(lit)] === Math.sign(lit)));
}

function partialOK(cnf, a) {
    return cnf.every(cl => {
        let unassigned = false;
        for (const lit of cl) {
            const v = a[Math.abs(lit)];
            if (v === 0) unassigned = true;
            if (v === Math.sign(lit)) return true;
        }
        return unassigned;
    });
}

