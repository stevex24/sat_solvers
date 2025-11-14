// sudoku-app.js

import { solveOne, solveAll } from "./browser-sat.js";
import { sudokuToCNF } from "./sudoku-encode.js";

/************ Helpers ************/

function $(id) { return document.getElementById(id); }

function setStatus(msg, isError = false) {
  const st = $("status");
  st.textContent = msg;
  st.classList.toggle("error", isError);
  st.classList.toggle("ok", !isError);
}

function showOutput(text) {
  $("solution").textContent = text;     // FIXED: use #solution, not #output
}

/************ Grid Helpers ************/

function readGrid() {
  const g = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      const v = $(`cell-${r}-${c}`).value.trim();
      row.push(v === "" ? 0 : Number(v));
    }
    g.push(row);
  }
  return g;
}

function writeGrid(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      $(`cell-${r}-${c}`).value = grid[r][c] === 0 ? "" : String(grid[r][c]);
    }
  }
}

/************ SAT → Sudoku grid ************/

function assignmentToGrid(sol) {
  const g = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let v = 1; v <= 9; v++) {
        const idx = (r - 1) * 81 + (c - 1) * 9 + v;
        if (sol[idx] === 1) g[r - 1][c - 1] = v;
      }
    }
  }
  return g;
}

function formatSolution(sol) {
  const g = assignmentToGrid(sol);
  return g.map(row => row.join(" ")).join("\n");
}

/************ Load Example ************/

function loadExample() {
  const ex = [
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
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      $(`cell-${r}-${c}`).value = ex[r][c] === "0" ? "" : ex[r][c];

  setStatus("Example puzzle loaded.");
  showOutput("");
}

/************ Solve ************/

function solvePuzzle() {
  const grid = readGrid();
  setStatus("Solving...");

  const { clauses, numVars } = sudokuToCNF(grid);
  const sol = solveOne(clauses, numVars);

  if (!sol) {
    setStatus("No solution exists.", true);
    return;
  }

  const g = assignmentToGrid(sol);
  writeGrid(g);

  setStatus("Solved!");
  showOutput(formatSolution(sol));
}

/************ Count All Solutions ************/

function countAll() {
  const grid = readGrid();
  setStatus("Counting solutions...");
  showOutput("Working...");

  const { clauses, numVars } = sudokuToCNF(grid);

  setTimeout(() => {
    const sols = solveAll(clauses, numVars);
    let msg = `Total solutions: ${sols.length}\n\n`;

    if (sols.length > 0) {
      msg += "First solution:\n";
      msg += formatSolution(sols[0]);
    }

    setStatus(`Found ${sols.length} solution(s).`);
    showOutput(msg);

    if (sols.length > 0) writeGrid(assignmentToGrid(sols[0]));

  }, 50);
}

/************ Clear ************/

function clearGrid() {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      $(`cell-${r}-${c}`).value = "";

  showOutput("");
  setStatus("Grid cleared.");
}

/************ Button Wiring ************/

$("load-example").onclick = loadExample;
$("clear-grid").onclick = clearGrid;
$("solve").onclick = solvePuzzle;
$("count-all").onclick = countAll;

setStatus("Ready!");

