// sudoku-app.js
// Self-contained browser Sudoku SAT solver (no counting),
// with full CNF encoding and a small DPLL solver.

// ------------------------------------------------------------
// Build the 9x9 input grid
// ------------------------------------------------------------
function buildGrid() {
  const grid = document.getElementById("grid");
  grid.innerHTML = "";

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const input = document.createElement("input");
      input.maxLength = 1;
      input.dataset.row = r;
      input.dataset.col = c;
      grid.appendChild(input);
    }
  }
}

// ------------------------------------------------------------
// Read the current grid into a 2D numeric array
// 0 = blank, 1..9 = digit
// ------------------------------------------------------------
function readGrid() {
  const cells = document.querySelectorAll("#grid input");
  let grid = [];
  let k = 0;

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let v = cells[k++].value.trim();
      if (v === "" || v === "." || v === "0") row.push(0);
      else row.push(parseInt(v, 10));
    }
    grid.push(row);
  }
  return grid;
}

// ------------------------------------------------------------
// Tiny DPLL-style SAT solver
// Variables are 1..numVars, assignment[v] in {0,1,-1}
// ------------------------------------------------------------
function solveSAT(clauses, numVars) {
  const assignment = new Array(numVars + 1).fill(0); // 0=unassigned, 1=true, -1=false

  function valueLit(lit) {
    const v = Math.abs(lit);
    const s = assignment[v];
    if (s === 0) return undefined;
    return lit > 0 ? s === 1 : s === -1;
  }

  function dfs() {
    // Check for conflicts; no fancy unit propagation for simplicity
    for (const clause of clauses) {
      let satisfied = false;
      let undecided = false;

      for (const lit of clause) {
        const v = valueLit(lit);
        if (v === true) {
          satisfied = true;
          break;
        }
        if (v === undefined) {
          undecided = true;
        }
      }

      if (!satisfied && !undecided) {
        // all literals false -> clause unsatisfied -> conflict
        return false;
      }
    }

    // Find first unassigned variable
    let varToAssign = 0;
    for (let v = 1; v <= numVars; v++) {
      if (assignment[v] === 0) {
        varToAssign = v;
        break;
      }
    }

    // If none, we have a full satisfying assignment
    if (varToAssign === 0) return true;

    // Try True
    assignment[varToAssign] = 1;
    if (dfs()) return true;

    // Try False
    assignment[varToAssign] = -1;
    if (dfs()) return true;

    // Backtrack
    assignment[varToAssign] = 0;
    return false;
  }

  const ok = dfs();
  return ok ? assignment : null;
}

// ------------------------------------------------------------
// Full Sudoku CNF encoding
// We use a simple variable mapping:
//   V(r,c,d) = (r-1)*81 + (c-1)*9 + d, where r,c,d in 1..9
// numVars = 9*9*9 = 729
// ------------------------------------------------------------
function sudokuToCNF(grid) {
  const clauses = [];
  const numVars = 9 * 9 * 9;

  function V(r, c, d) {
    return (r - 1) * 81 + (c - 1) * 9 + d; // 1..729
  }

  // 1. Each cell has exactly one digit
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      // At least one digit in cell
      const atLeast = [];
      for (let d = 1; d <= 9; d++) {
        atLeast.push(V(r, c, d));
      }
      clauses.push(atLeast);

      // At most one digit in cell
      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-V(r, c, d1), -V(r, c, d2)]);
        }
      }
    }
  }

  // 2. Each digit appears exactly once in each row
  for (let r = 1; r <= 9; r++) {
    for (let d = 1; d <= 9; d++) {
      // At least once in row
      const rowClause = [];
      for (let c = 1; c <= 9; c++) {
        rowClause.push(V(r, c, d));
      }
      clauses.push(rowClause);

      // At most once in row
      for (let c1 = 1; c1 <= 9; c1++) {
        for (let c2 = c1 + 1; c2 <= 9; c2++) {
          clauses.push([-V(r, c1, d), -V(r, c2, d)]);
        }
      }
    }
  }

  // 3. Each digit appears exactly once in each column
  for (let c = 1; c <= 9; c++) {
    for (let d = 1; d <= 9; d++) {
      // At least once in column
      const colClause = [];
      for (let r = 1; r <= 9; r++) {
        colClause.push(V(r, c, d));
      }
      clauses.push(colClause);

      // At most once in column
      for (let r1 = 1; r1 <= 9; r1++) {
        for (let r2 = r1 + 1; r2 <= 9; r2++) {
          clauses.push([-V(r1, c, d), -V(r2, c, d)]);
        }
      }
    }
  }

  // 4. Each digit appears exactly once in each 3x3 block
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let d = 1; d <= 9; d++) {
        // At least once in block
        const blockClause = [];
        for (let r = 1 + br * 3; r <= (br + 1) * 3; r++) {
          for (let c = 1 + bc * 3; c <= (bc + 1) * 3; c++) {
            blockClause.push(V(r, c, d));
          }
        }
        clauses.push(blockClause);

        // At most once in block
        const cells = [];
        for (let r = 1 + br * 3; r <= (br + 1) * 3; r++) {
          for (let c = 1 + bc * 3; c <= (bc + 1) * 3; c++) {
            cells.push([r, c]);
          }
        }
        for (let i = 0; i < cells.length; i++) {
          for (let j = i + 1; j < cells.length; j++) {
            const [r1, c1] = cells[i];
            const [r2, c2] = cells[j];
            clauses.push([-V(r1, c1, d), -V(r2, c2, d)]);
          }
        }
      }
    }
  }

  // 5. Given digits from the puzzle
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      const val = grid[r - 1][c - 1];
      if (val !== 0) {
        clauses.push([V(r, c, val)]);
      }
    }
  }

  return { clauses, numVars };
}

// ------------------------------------------------------------
// Write the solved Sudoku into the green grid
// ------------------------------------------------------------
function writeSolution(sol) {
  const out = document.getElementById("solution");
  out.innerHTML = "";

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      let digit = 0;
      for (let d = 1; d <= 9; d++) {
        const v = (r - 1) * 81 + (c - 1) * 9 + d;
        if (sol[v] === 1) {
          digit = d;
          break;
        }
      }
      const cell = document.createElement("div");
      cell.textContent = digit === 0 ? "" : String(digit);
      out.appendChild(cell);
    }
  }
}

// ------------------------------------------------------------
// Status helper
// ------------------------------------------------------------
function setStatus(msg, isError = false) {
  const s = document.getElementById("status");
  s.textContent = msg;
  s.className = isError ? "status error" : (msg ? "status ok" : "status");
}

// ------------------------------------------------------------
// Button wiring
// ------------------------------------------------------------
document.getElementById("load-example").onclick = () => {
  const example = [
    "530070000",
    "600195000",
    "098000060",
    "800060003",
    "400803001",
    "700020006",
    "060000280",
    "000419005",
    "000080079"
  ];

  const cells = document.querySelectorAll("#grid input");
  let k = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = example[r][c];
      cells[k++].value = ch === "0" ? "" : ch;
    }
  }
  setStatus("Example puzzle loaded.", false);
};

document.getElementById("clear-grid").onclick = () => {
  const cells = document.querySelectorAll("#grid input");
  for (let i = 0; i < cells.length; i++) cells[i].value = "";
  document.getElementById("solution").innerHTML = "";
  setStatus("");
};

document.getElementById("solve").onclick = () => {
  setStatus("Solving...");
  const grid = readGrid();
  const { clauses, numVars } = sudokuToCNF(grid);
  const sol = solveSAT(clauses, numVars);
  if (!sol) {
    setStatus("No solution found.", true);
    return;
  }
  writeSolution(sol);
  setStatus("Solved!");
};

// ------------------------------------------------------------
// Initialize page
// ------------------------------------------------------------
buildGrid();

