// sudoku-encode.js
//
// Encode 9×9 Sudoku into CNF for SAT solver.
// x(r,c,v) → variable number (1..729)

export function varNum(r, c, v) {
    return (r - 1) * 81 + (c - 1) * 9 + v;
}

export function sudokuToCNF(grid) {
    const clauses = [];

    // Cell constraints
    for (let r = 1; r <= 9; r++) {
        for (let c = 1; c <= 9; c++) {
            const row = [];
            for (let v = 1; v <= 9; v++) row.push(varNum(r, c, v));
            clauses.push(row);

            for (let v1 = 1; v1 <= 9; v1++) {
                for (let v2 = v1 + 1; v2 <= 9; v2++) {
                    clauses.push([-varNum(r,c,v1), -varNum(r,c,v2)]);
                }
            }
        }
    }

    // Row constraints
    for (let r = 1; r <= 9; r++) {
        for (let v = 1; v <= 9; v++) {
            const row = [];
            for (let c = 1; c <= 9; c++) row.push(varNum(r,c,v));
            clauses.push(row);

            for (let c1 = 1; c1 <= 9; c1++) {
                for (let c2 = c1 + 1; c2 <= 9; c2++) {
                    clauses.push([-varNum(r,c1,v), -varNum(r,c2,v)]);
                }
            }
        }
    }

    // Column constraints
    for (let c = 1; c <= 9; c++) {
        for (let v = 1; v <= 9; v++) {
            const row = [];
            for (let r = 1; r <= 9; r++) row.push(varNum(r,c,v));
            clauses.push(row);

            for (let r1 = 1; r1 <= 9; r1++) {
                for (let r2 = r1 + 1; r2 <= 9; r2++) {
                    clauses.push([-varNum(r1,c,v), -varNum(r2,c,v)]);
                }
            }
        }
    }

    // Box constraints
    for (let br = 0; br < 3; br++) {
        for (let bc = 0; bc < 3; bc++) {
            for (let v = 1; v <= 9; v++) {
                const row = [];
                for (let r = 1; r <= 3; r++) {
                    for (let c = 1; c <= 3; c++) {
                        row.push(varNum(3*br+r, 3*bc+c, v));
                    }
                }
                clauses.push(row);

                const cells = [];
                for (let r = 1; r <= 3; r++) {
                    for (let c = 1; c <= 3; c++) {
                        cells.push([3*br+r, 3*bc+c]);
                    }
                }
                for (let i = 0; i < cells.length; i++) {
                    for (let j = i+1; j < cells.length; j++) {
                        const [r1,c1] = cells[i];
                        const [r2,c2] = cells[j];
                        clauses.push([-varNum(r1,c1,v), -varNum(r2,c2,v)]);
                    }
                }
            }
        }
    }

    // Prefilled cells
    for (let r = 1; r <= 9; r++) {
        for (let c = 1; c <= 9; c++) {
            const v = grid[r-1][c-1];
            if (v !== 0) clauses.push([varNum(r,c,v)]);
        }
    }

    return { clauses, numVars: 729 };
}

