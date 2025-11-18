// sudoku-app.js
// Complete working browser Sudoku SAT solver (simple one-solution version)

//////////////////////////////////////////////////////
// Build the 9x9 input grid
//////////////////////////////////////////////////////

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

//////////////////////////////////////////////////////
// Read user input
//////////////////////////////////////////////////////

function readGrid() {
  const cells = document.querySelectorAll("#grid input");
  let grid = [];
  let idx = 0;

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let v = cells[idx++].value.trim();
      if (v === "" || v === "." || v === "0") row.push(0);
      else row.push(parseInt(v));
    }
    grid.push(row);
  }
  return grid;
}

//////////////////////////////////////////////////////
// Small DPLL SAT solver
//////////////////////////////////////////////////////

function solveSAT(clauses, numVars) {
  let assignment = new Array(numVars + 1).fill(0);

  function valueLit(lit) {
    let v = Math.abs(lit);
    let s = assignment[v];
    if (s === 0) return undefined;
    return (lit > 0 ? s === 1 : s === -1);
  }

  function dfs() {
    // Check clauses
    for (let clause of clauses) {
      let satisfied = false;
      let undec = false;

      for (let lit of clause) {
        let v = valueLit(lit);
        if (v === true) {
          satisfied = true;
          break;
        }
        if (v === undefined) undec = true;
      }

      if (!satisfied && !undec) return false;
    }

    // If no unassigned variables → success
    let v = assignment.indexOf(0);
    if (v === -1) return true;

    assignment[v] = 1;
    if (dfs()) return true;

    assignment[v] = -1;
    if (dfs()) return true;

    assignment[v] = 0;
    return false;
  }

  if (dfs()) return assignment;
  return null;
}

//////////////////////////////////////////////////////
// Full Sudoku CNF encoder
//////////////////////////////////////////////////////

function sudokuToCNF(grid) {
  let clauses = [];
  const numVars = 9 * 9 * 9;

  function V(r, c, d) {
    return 100 * r + 10 * c + d;
  }

  // ---------- Cell constraints ----------
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      let atLeast = [];
      for (let d = 1; d <= 9; d++) atLeast.push(V(r, c, d));
      clauses.push(atLeast);

      for (let d1 = 1; d1 <= 9; d1++)
        for (let d2 = d1 + 1; d2 <= 9; d2++)
          clauses.push([-V(r,c,d1), -V(r,c,d2)]);
    }
  }

  // ---------- Row constraints ----------
  for (let r = 1; r <= 9; r++) {
    for (let d = 1; d <= 9; d++) {
      let row = [];
      for (let c = 1; c <= 9; c++) row.push(V(r,c,d));
      clauses.push(row);

      for (let c1 = 1; c1 <= 9; c1++)
        for (let c2 = c1+1; c2 <= 9; c2++)
          clauses.push([-V(r,c1,d), -V(r,c2,d)]);
    }
  }

  // ---------- Column constraints ----------
  for (let c = 1; c <= 9; c++) {
    for (let d = 1; d <= 9; d++) {
      let col = [];
      for (let r = 1; r <= 9; r++) col.push(V(r,c,d));
      clauses.push(col);

      for (let r1 = 1; r1 <= 9; r1++)
        for (let r2 = r1+1; r2 <= 9; r2++)
          clauses.push([-V(r1,c,d), -V(r2,c,d)]);
    }
  }

  // ---------- 3×3 block constraints ----------
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      for (let d = 1; d <= 9; d++) {
        let block = [];
        for (let r = br*3 + 1; r <= br*3 + 3; r++)
          for (let c = bc*3 + 1; c <= bc*3 + 3; c++)
            block.push(V(r,c,d));

        clauses.push(block);

        for (let i = 0; i < block.length; i++)
          for (let j = i+1; j < block.length; j++)
            clauses.push([-block[i], -block[j]]);
      }
    }
  }

  // ---------- Pre-filled clues ----------
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      if (grid[r-1][c-1] !== 0) {
        let d = grid[r-1][c-1];
        clauses.push([V(r,c,d)]);
      }
    }
  }

  return { clauses, numVars };
}

//////////////////////////////////////////////////////
// Write the solved grid
//////////////////////////////////////////////////////

function writeSolution(assign) {
  const out = document.getElementById("solution");
  out.innerHTML = "";

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let d = 1; d <= 9; d++) {
        const v = 100*r + 10*c + d;
        if (assign[v] === 1) {
          const div = document.createElement("div");
          div.textContent = d;
          out.appendChild(div);
        }
      }
    }
  }
}

//////////////////////////////////////////////////////
// UI buttons
//////////////////////////////////////////////////////

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

  const inputs = document.querySelectorAll("#grid input");
  let k = 0;

  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      inputs[k++].value = example[r][c] === "0" ? "" : example[r][c];
};

document.getElementById("clear-grid").onclick = () => {
  document.querySelectorAll("#grid input").forEach(i => i.value = "");
  document.getElementById("solution").innerHTML = "";
  document.getElementById("status").textContent = "";
};

document.getElementById("solve").onclick = () => {
  const status = document.getElementById("status");
  status.textContent = "Solving...";

  const grid = readGrid();
  const { clauses, numVars } = sudokuToCNF(grid);
  const sol = solveSAT(clauses, numVars);

  if (!sol) {
    status.textContent = "No solution";
    status.className = "status error";
  } else {
    writeSolution(sol);
    status.textContent = "Solved!";
    status.className = "status ok";
  }
};

//////////////////////////////////////////////////////
// Init
//////////////////////////////////////////////////////

buildGrid();

