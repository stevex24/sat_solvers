// sudoku-app.js
// Browser UI for Sudoku SAT solver with solution counting.

import { sudokuToCNF } from "./sudoku-encode.js";
import { solveOne, solveAll } from "./browser-sat.js";

/******************** DOM Helpers ********************/

function $(id) {
  return document.getElementById(id);
}

function setStatus(msg, isError = false) {
  const st = $("status");
  st.textContent = msg;
  st.classList.toggle("error", isError);
  st.classList.toggle("ok", !isError);
}

function clearSolutionDisplay() {
  $("solution").innerHTML = "";
}

/******************** Grid Construction & I/O ********************/

function buildGrid() {
  const grid = $("grid");
  grid.innerHTML = "";

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.dataset.row = r;
      input.dataset.col = c;
      grid.appendChild(input);
    }
  }
}

// Read puzzle from the 9x9 input grid
function readGrid() {
  const cells = $("#grid").querySelectorAll("input");
  const grid = [];
  let k = 0;

  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      const v = cells[k++].value.trim();
      if (v === "" || v === "." || v === "0") {
        row.push(0);
      } else {
        const n = parseInt(v, 10);
        row.push(Number.isNaN(n) ? 0 : n);
      }
    }
    grid.push(row);
  }
  return grid;
}

// Write a full 9x9 solution grid into the "solution" div
function writeSolutionFromAssignment(asg) {
  const container = $("solution");
  container.innerHTML = "";

  // asg[v] in {-1,0,1}, and variables are encoded as 100*r + 10*c + d
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      let digit = 0;
      for (let d = 1; d <= 9; d++) {
        const v = 100 * r + 10 * c + d;
        if (asg[v] === 1) {
          digit = d;
          break;
        }
      }
      const cell = document.createElement("div");
      cell.textContent = digit === 0 ? "" : String(digit);
      container.appendChild(cell);
    }
  }
}

/******************** Button Actions ********************/

function loadExample() {
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

  const cells = $("#grid").querySelectorAll("input");
  let k = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = example[r][c];
      cells[k++].value = ch === "0" ? "" : ch;
    }
  }

  clearSolutionDisplay();
  setStatus("Example puzzle loaded.", false);
}

function clearGrid() {
  const cells = $("#grid").querySelectorAll("input");
  cells.forEach(cell => (cell.value = ""));
  clearSolutionDisplay();
  setStatus("Grid cleared.", false);
}

function solveOneSolution() {
  clearSolutionDisplay();
  setStatus("Solving...", false);

  const grid = readGrid();
  const { clauses, numVars } = sudokuToCNF(grid);
  const sol = solveOne(clauses, numVars);

  if (!sol) {
    setStatus("No solution exists.", true);
    return;
  }

  writeSolutionFromAssignment(sol);
  setStatus("Solved (1 solution).", false);
}

function countAllSolutionsAction() {
  clearSolutionDisplay();
  setStatus("Counting all solutions (this may take a moment)...", false);

  const grid = readGrid();
  const { clauses, numVars } = sudokuToCNF(grid);

  // Yield to the browser so status updates before heavy work
  setTimeout(() => {
    const sols = solveAll(clauses, numVars, 2);  // Hard cap for speed

    const count = sols.length;

    if (count === 0) {
      setStatus("No solutions found.", true);
      return;
    }

    writeSolutionFromAssignment(sols[0]);
    setStatus(`Total solutions: ${count}`, false);
  }, 20);
}

/******************** Initialization ********************/

buildGrid();

$("load-example").onclick = loadExample;
$("clear-grid").onclick = clearGrid;
$("solve").onclick = solveOneSolution;
$("count-all").onclick = countAllSolutionsAction;

setStatus("Ready.", false);

