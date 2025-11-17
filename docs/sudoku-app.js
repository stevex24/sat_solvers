// sudoku-app.js
// This file contains the working in-browser SAT solver + Sudoku encoding.

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

function readGrid() {
  const cells = document.querySelectorAll("#grid input");
  let grid = [];
  let k = 0;

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let v = cells[k++].value.trim();
      if (v === "" || v === "." || v === "0") row.push(0);
      else row.push(parseInt(v));
    }
    grid.push(row);
  }
  return grid;
}

// A very small SAT solver (pure JS)
function solveSAT(clauses, numVars) {
  let assignment = new Array(numVars + 1).fill(0);

  function valueLit(lit) {
    let v = Math.abs(lit);
    let s = assignment[v];
    if (s === 0) return undefined;
    return (lit > 0 ? s === 1 : s === -1);
  }

  function dfs() {
    for (let clause of clauses) {
      let satisfied = false;
      let undecided = false;

      for (let lit of clause) {
        let v = valueLit(lit);
        if (v === true) { satisfied = true; break; }
        if (v === undefined) undecided = true;
      }
      if (!satisfied && !undecided) return false;
    }

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

// Sudoku → CNF
function sudokuToCNF(grid) {
  let clauses = [];
  let numVars = 999;

  function V(r, c, d) {
    return 100 * r + 10 * c + d;
  }

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      if (grid[r - 1][c - 1] !== 0) {
        let d = grid[r - 1][c - 1];
        clauses.push([V(r, c, d)]);
      }
    }
  }

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      let atLeast = [];
      for (let d = 1; d <= 9; d++) atLeast.push(V(r, c, d));
      clauses.push(atLeast);

      for (let d1 = 1; d1 <= 9; d1++) {
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          clauses.push([-V(r, c, d1), -V(r, c, d2)]);
        }
      }
    }
  }

  return { clauses, numVars };
}

function writeSolution(sol) {
  const out = document.getElementById("solution");
  out.innerHTML = "";

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let d = 1; d <= 9; d++) {
        if (sol[100 * r + 10 * c + d] === 1) {
          const div = document.createElement("div");
          div.textContent = d;
          out.appendChild(div);
        }
      }
    }
  }
}

function setStatus(msg, err = false) {
  const s = document.getElementById("status");
  s.textContent = msg;
  s.className = err ? "status error" : "status ok";
}

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
    "000080079",
  ];

  const cells = document.querySelectorAll("#grid input");
  let k = 0;

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let ch = example[r][c];
      cells[k++].value = ch === "0" ? "" : ch;
    }
  }
};

document.getElementById("clear-grid").onclick = () => {
  const cells = document.querySelectorAll("#grid input");
  for (let i = 0; i < cells.length; i++) cells[i].value = "";
  document.getElementById("solution").innerHTML = "";
  setStatus("");
};

document.getElementById("solve").onclick = () => {
  setStatus("Solving…");

  const grid = readGrid();
  const { clauses, numVars } = sudokuToCNF(grid);
  const sol = solveSAT(clauses, numVars);

  if (!sol) {
    setStatus("No solution", true);
    return;
  }

  writeSolution(sol);
  setStatus("Solved!");
};

buildGrid();

