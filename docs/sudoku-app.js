// sudoku-app.js
//
// Browser-based front-end for the SAT-based Sudoku solver.
// Uses browser-sat.js (SAT solver) and sudoku-encode.js (CNF encoder).

import { solveOne, solveAll } from "./browser-sat.js";
import { sudokuToCNF } from "./sudoku-encode.js";

/***********************************************************
 * UI Helpers
 ***********************************************************/

function $(id) {
  return document.getElementById(id);
}

function showOutput(text) {
  $("output").textContent = text;
}

function setStatus(msg, error = false) {
  const el = $("status");
  el.textContent = msg;
  el.classList.toggle("error", error);
  el.classList.toggle("ok", !error);
}

/***********************************************************
 * Read / Write Grid
 ***********************************************************/

function readGrid() {
  const grid = [];
  for (let r = 0; r < 9; r++) {
    const row = [];
    for (let c = 0; c < 9; c++) {
      const v = $(`cell-${r}-${c}`).value.trim();
      row.push(v === "" ? 0 : Number(v));
    }
    grid.push(row);
  }
  return grid;
}

function writeGrid(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      $(`cell-${r}-${c}`).value = grid[r][c] === 0 ? "" : String(grid[r][c]);
    }
  }
}

/***********************************************************
 * Format SAT Assignment → 9×9 Solution Grid
 ***********************************************************/

function assignmentToGrid(sol) {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let v = 1; v <= 9; v++) {
        const idx = (r - 1) * 81 + (c - 1) * 9 + v;
        if (sol[idx] === 1) {
          grid[r - 1][c - 1] = v;
        }
      }
    }
  }
  return grid;
}

function formatSolution(sol) {
  const g = assignmentToGrid(sol);
  return g.map(row => row.join(" ")).join("\n");
}

/***********************************************************
 * Load Example Puzzle
 ***********************************************************/

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
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const ch = example[r][c];
      $(`cell-${r}-${c}`).value = ch === "0" ? "" : ch;
    }
  }
  setStatus("Example puzzle loaded.");
  showOutput("");
}

/***********************************************************
 * Solve One Solution
 ***********************************************************/

function solvePuzzle() {
  const grid = readGrid();
  setStatus("Solving...", false);
  showOutput("");

  const { clauses, numVars } = sudokuToCNF(grid);
  const sol = solveOne(clauses, numVars);

  if (!sol) {
    setStatus("No solution exists.", true);
    return;
  }

  const solutionGrid = assignmentToGrid(sol);
  writeGrid(solutionGrid);

  setStatus("Solved successfully!", false);
  showOutput(formatSolution(sol));
}

/***********************************************************
 * Count All Solutions
 ***********************************************************/

function countSolutions() {
  const grid = readGrid();

  setStatus("Counting solutions...", false);
  showOutput("Working...\n(This may take a few seconds.)");

  const { clauses, numVars } = sudokuToCNF(grid);

  // yield to UI before SAT search
  setTimeout(() => {
    const sols = solveAll(clauses, numVars);
    const count = sols.length;

    let out = `Total solutions: ${count}\n\n`;
    if (count > 0) {
      out += "First solution:\n";
      out += formatSolution(sols[0]);
    }

    setStatus(`Found ${count} solution(s).`, false);
    showOutput(out);

    if (count > 0) {
      const firstGrid = assignmentToGrid(sols[0]);
      writeGrid(firstGrid);
    }

  }, 30);
}

/***********************************************************
 * Clear Grid
 ***********************************************************/

function clearGrid() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      $(`cell-${r}-${c}`).value = "";
    }
  }
  showOutput("");
  setStatus("Grid cleared.", false);
}

/***********************************************************
 * Button Wiring
 ***********************************************************/

$("load-example").onclick = loadExample;
$("clear-grid").onclick = clearGrid;
$("solve").onclick = solvePuzzle;
$("count-all").onclick = countSolutions;

setStatus("Ready!", false);

