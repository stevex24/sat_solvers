// sudoku-app.js

import { sudokuToCNF } from "./sudoku-encode.js";
import { solveOne, solveAll } from "./browser-sat.js";

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
      let val = cells[k++].value.trim();
      row.push(val === "." || val === "0" ? 0 : parseInt(val));
    }
    grid.push(row);
  }
  return grid;
}

function writeSolution(sol) {
  const out = document.getElementById("solution");
  out.innerHTML = "";

  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      for (let d = 1; d <= 9; d++) {
        let v = 100*r + 10*c + d;
        if (sol[v] === 1) {
          const div = document.createElement("div");
          div.textContent = d;
          out.appendChild(div);
        }
      }
    }
  }
}

function setStatus(msg, isErr=false) {
  const s = document.getElementById("status");
  s.textContent = msg;
  s.classList.toggle("error", isErr);
  s.classList.toggle("ok", !isErr);
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
    "000080079"
  ];

  const inputs = document.querySelectorAll("#grid input");
  let k = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      inputs[k++].value = example[r][c] === "0" ? "" : example[r][c];
    }
  }
};

document.getElementById("clear-grid").onclick = () => {
  const inputs = document.querySelectorAll("#grid input");
  for (let i = 0; i < inputs.length; i++) inputs[i].value = "";
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

document.getElementById("count-all").onclick = () => {
  setStatus("Counting solutions...");
  const grid = readGrid();
  const { clauses, numVars } = sudokuToCNF(grid);

  const sols = solveAll(clauses, numVars, Infinity);
  if (sols.length === 0) {
    setStatus("No solutions", true);
    return;
  }

  writeSolution(sols[0]);
  setStatus(`Total Solutions: ${sols.length}`);
};

buildGrid();

