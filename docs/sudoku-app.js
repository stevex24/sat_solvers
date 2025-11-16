// docs/sudoku-app.js

import { sudokuToCNF } from "./sudoku-encode.js";
import { solveOne } from "./browser-sat.js";

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
      row.push(val === "." || val === "0" || val === "" ? 0 : parseInt(val, 10));
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
        const v = 100 * r + 10 * c + d;
        if (sol[v] === 1) {
          const div = document.createElement("div");
          div.textContent = d;
          out.appendChild(div);
        }
      }
    }
  }
}

function setStatus(msg, isErr = false) {
  const s = document.getElementById("status");
  s.textContent = msg;
  s.classList.toggle("error", isErr);
  s.classList.toggle("ok", !isErr && msg !== "");
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
      const ch = example[r][c];
      inputs[k++].value = ch === "0" ? "" : ch;
    }
  }

  setStatus("Example puzzle loaded.");
};

document.getElementById("clear-grid").onclick = () => {
  const inputs = document.querySelectorAll("#grid input");
  for (let i = 0; i < inputs.length; i++) inputs[i].value = "";
  document.getElementById("solution").innerHTML = "";
  setStatus("");
};

document.getElementById("solve").onclick = () => {
  try {
    setStatus("Solving...");
    const grid = readGrid();
    const { clauses, numVars } = sudokuToCNF(grid);
    const sol = solveOne(clauses, numVars);

    if (!sol) {
      setStatus("No solution found.", true);
      return;
    }

    writeSolution(sol);
    setStatus("Solved!");
  } catch (e) {
    console.error("Error during solve:", e);
    setStatus("Error during solve (see console).", true);
  }
};

// Build the initial empty grid on load
buildGrid();

