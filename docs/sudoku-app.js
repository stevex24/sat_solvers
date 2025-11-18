// sudoku-app.js
// UI + SAT solver integration for the browser Sudoku solver

import { sudokuToCNF } from "./sudoku-encode.js";
import { solveOne } from "./browser-sat.js";

//////////////////////////////////////////////////////
// Build the 9×9 input grid
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
// Read the grid into a 2D array
//////////////////////////////////////////////////////

function readGrid() {
  const cells = document.querySelectorAll("#grid input");
  let grid = [];
  let k = 0;

  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      const v = cells[k++].value.trim();
      if (v === "" || v === "." || v === "0") row.push(0);
      else row.push(parseInt(v));
    }
    grid.push(row);
  }
  return grid;
}

//////////////////////////////////////////////////////
// Write SAT solution into the output grid
//////////////////////////////////////////////////////

function writeSolution(assignment) {
  const out = document.getElementById("solution");
  out.innerHTML = "";

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let d = 1; d <= 9; d++) {
        const v = 100 * r + 10 * c + d;
        if (assignment[v] === 1) {
          const cell = document.createElement("div");
          cell.textContent = d;
          out.appendChild(cell);
        }
      }
    }
  }
}

//////////////////////////////////////////////////////
// UI Helpers
//////////////////////////////////////////////////////

function setStatus(msg, isErr = false) {
  const s = document.getElementById("status");
  s.textContent = msg;
  s.classList.toggle("error", isErr);
  s.classList.toggle("ok", !isErr);
}

//////////////////////////////////////////////////////
// Button Handlers
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

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = example[r][c];
      inputs[k++].value = ch === "0" ? "" : ch;
    }
  }
};

document.getElementById("clear-grid").onclick = () => {
  const inputs = document.querySelectorAll("#grid input");
  for (let inp of inputs) inp.value = "";
  document.getElementById("solution").innerHTML = "";
  setStatus("");
};

document.getElementById("solve").onclick = () => {
  setStatus("Solving...");

  const grid = readGrid();
  const { clauses, numVars } = sudokuToCNF(grid);

  const sol = solveOne(clauses, numVars);
  if (!sol) {
    setStatus("No solution found", true);
    return;
  }

  writeSolution(sol);
  setStatus("Solved!");
};

//////////////////////////////////////////////////////
// Initialize the UI
//////////////////////////////////////////////////////

buildGrid();

