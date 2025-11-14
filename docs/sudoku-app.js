// sudoku-app.js
// Browser-based SAT Sudoku solver using a simple DPLL SAT solver.

// ------------------------ SAT Solver ------------------------

function solveSAT(clauses, numVars) {
  // assignment[v] = 0 (unassigned), 1 (true), -1 (false)
  const assignment = new Array(numVars + 1).fill(0);

  function valueOfLiteral(lit) {
    const v = Math.abs(lit);
    const val = assignment[v];
    if (val === 0) return 0;
    return lit > 0 ? val : -val;
  }

  function unitPropagate() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const clause of clauses) {
        let numUnassigned = 0;
        let lastUnassigned = null;
        let clauseSatisfied = false;

        for (const lit of clause) {
          const val = valueOfLiteral(lit);
          if (val === 1) {
            clauseSatisfied = true;
            break;
          } else if (val === 0) {
            numUnassigned++;
            lastUnassigned = lit;
          }
        }

        if (!clauseSatisfied) {
          if (numUnassigned === 0) {
            // All literals false => conflict
            return false;
          } else if (numUnassigned === 1) {
            // Unit clause => force assignment
            const v = Math.abs(lastUnassigned);
            const val = lastUnassigned > 0 ? 1 : -1;
            if (assignment[v] === 0) {
              assignment[v] = val;
              changed = true;
            } else if (assignment[v] !== val) {
              // Conflict
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  function backtrack() {
    if (!unitPropagate()) return false;

    // Find first unassigned variable
    let v = 1;
    while (v <= numVars && assignment[v] !== 0) v++;
    if (v > numVars) {
      // All assigned without conflict => SAT
      return true;
    }

    // Try v = true
    const snapshot = assignment.slice();
    assignment[v] = 1;
    if (backtrack()) return true;

    // Restore and try v = false
    for (let i = 1; i <= numVars; i++) assignment[i] = snapshot[i];
    assignment[v] = -1;
    if (backtrack()) return true;

    // Restore and fail
    for (let i = 1; i <= numVars; i++) assignment[i] = snapshot[i];
    return false;
  }

  const sat = backtrack();
  if (!sat) return { sat: false, model: null };

  const model = new Array(numVars + 1).fill(false);
  for (let v = 1; v <= numVars; v++) {
    model[v] = assignment[v] === 1;
  }
  return { sat: true, model };
}

// ------------------------ Sudoku Encoding ------------------------

function varNum(r, c, d) {
  // r, c, d in 1..9
  return (r - 1) * 81 + (c - 1) * 9 + d;
}

function encodeSudoku(grid) {
  const clauses = [];
  const numVars = 9 * 9 * 9;

  // 1. Each cell has at least one digit
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      const clause = [];
      for (let d = 1; d <= 9; d++) {
        clause.push(varNum(r, c, d));
      }
      clauses.push(clause);
    }
  }

  // 2. Each cell has at most one digit
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-varNum(r, c, d1), -varNum(r, c, d2)]);
        }
      }
    }
  }

  // 3. Row constraints
  for (let r = 1; r <= 9; r++) {
    for (let d = 1; d <= 9; d++) {
      // At least one in row
      const clause = [];
      for (let c = 1; c <= 9; c++) {
        clause.push(varNum(r, c, d));
      }
      clauses.push(clause);

      // At most one in row
      for (let c1 = 1; c1 <= 9; c1++) {
        for (let c2 = c1 + 1; c2 <= 9; c2++) {
          clauses.push([-varNum(r, c1, d), -varNum(r, c2, d)]);
        }
      }
    }
  }

  // 4. Column constraints
  for (let c = 1; c <= 9; c++) {
    for (let d = 1; d <= 9; d++) {
      // At least one in column
      const clause = [];
      for (let r = 1; r <= 9; r++) {
        clause.push(varNum(r, c, d));
      }
      clauses.push(clause);

      // At most one in column
      for (let r1 = 1; r1 <= 9; r1++) {
        for (let r2 = r1 + 1; r2 <= 9; r2++) {
          clauses.push([-varNum(r1, c, d), -varNum(r2, c, d)]);
        }
      }
    }
  }

  // 5. Block constraints (3x3)
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let d = 1; d <= 9; d++) {
        // At least one in each block
        const clause = [];
        const cells = [];
        for (let r = 1 + br * 3; r <= 3 + br * 3; r++) {
          for (let c = 1 + bc * 3; c <= 3 + bc * 3; c++) {
            clause.push(varNum(r, c, d));
            cells.push([r, c]);
          }
        }
        clauses.push(clause);

        // At most one in block
        for (let i = 0; i < cells.length; i++) {
          for (let j = i + 1; j < cells.length; j++) {
            const [r1, c1] = cells[i];
            const [r2, c2] = cells[j];
            clauses.push([-varNum(r1, c1, d), -varNum(r2, c2, d)]);
          }
        }
      }
    }
  }

  // 6. Prefilled digits
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      const d = grid[r - 1][c - 1];
      if (d >= 1 && d <= 9) {
        clauses.push([varNum(r, c, d)]);
      }
    }
  }

  return { clauses, numVars };
}

function modelToGrid(model) {
  const result = [];
  for (let r = 1; r <= 9; r++) {
    const row = [];
    for (let c = 1; c <= 9; c++) {
      let digit = 0;
      for (let d = 1; d <= 9; d++) {
        const v = varNum(r, c, d);
        if (model[v]) {
          digit = d;
          break;
        }
      }
      row.push(digit);
    }
    result.push(row);
  }
  return result;
}

// ------------------------ UI Logic ------------------------

function createGrid() {
  const gridDiv = document.getElementById("grid");
  gridDiv.innerHTML = "";
  const inputs = [];

  for (let r = 0; r < 9; r++) {
    const rowInputs = [];
    for (let c = 0; c < 9; c++) {
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.dataset.row = r;
      input.dataset.col = c;
      rowInputs.push(input);
      gridDiv.appendChild(input);
    }
    inputs.push(rowInputs);
  }
  return inputs;
}

function readGrid(inputs) {
  const grid = [];
  let valid = true;

  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      const input = inputs[r][c];
      input.classList.remove("invalid");
      const val = input.value.trim();
      if (val === "" || val === "0" || val === ".") {
        row.push(0);
      } else {
        const n = Number(val);
        if (!Number.isInteger(n) || n < 1 || n > 9) {
          input.classList.add("invalid");
          valid = false;
          row.push(0);
        } else {
          row.push(n);
        }
      }
    }
    grid.push(row);
  }

  return { grid, valid };
}

function displaySolution(grid) {
  const solutionDiv = document.getElementById("solution");
  solutionDiv.innerHTML = "";
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const cell = document.createElement("div");
      cell.textContent = grid[r][c] === 0 ? "" : String(grid[r][c]);
      solutionDiv.appendChild(cell);
    }
  }
}

function setStatus(msg, isError = false) {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = msg;
  statusDiv.classList.toggle("error", isError);
  statusDiv.classList.toggle("ok", !isError);
}

function loadExample(inputs) {
  // Same example puzzle as your CLI version
  const example = [
    "530070000",
    "600195000",
    "098000060",
    "800060003",
    "400803001",
    "700020006",
    "060000280",
    "000419005",
    "000080079",
  ];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = example[r][c];
      inputs[r][c].value = ch === "0" ? "" : ch;
    }
  }
}

function clearGrid(inputs) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      inputs[r][c].value = "";
      inputs[r][c].classList.remove("invalid", "given");
    }
  }
  document.getElementById("solution").innerHTML = "";
  setStatus("");
}

// Initialize UI
document.addEventListener("DOMContentLoaded", () => {
  const inputs = createGrid();

  document.getElementById("load-example").addEventListener("click", () => {
    loadExample(inputs);
    setStatus("Example puzzle loaded.", false);
  });

  document.getElementById("clear-grid").addEventListener("click", () => {
    clearGrid(inputs);
  });

  document.getElementById("solve").addEventListener("click", () => {
    const { grid, valid } = readGrid(inputs);
    if (!valid) {
      setStatus("Invalid input: use digits 1-9, 0 or blank for empty cells.", true);
      return;
    }

    setStatus("Encoding puzzle as SAT and solving...", false);

    try {
      const { clauses, numVars } = encodeSudoku(grid);
      const result = solveSAT(clauses, numVars);
      if (!result.sat) {
        setStatus("No solution found (UNSAT).", true);
        document.getElementById("solution").innerHTML = "";
        return;
      }
      const solvedGrid = modelToGrid(result.model);
      displaySolution(solvedGrid);
      setStatus("Solved successfully using SAT.", false);
    } catch (e) {
      console.error(e);
      setStatus("Error during solving. See console for details.", true);
    }
  });
});

