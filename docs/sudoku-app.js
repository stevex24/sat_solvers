// sudoku-app.js
// UI for Sudoku SAT solver using tinySat.js + sudoku-encode.js
// - Keeps textarea and 9x9 grid in live sync
// - Provides Beginner / Intermediate / Advanced preset puzzles
// - Colors solver-filled cells differently from givens for aesthetics.

(function () {
  "use strict";

  // --- DOM lookups ---------------------------------------------------------

  const textarea = document.getElementById("sudoku-input");
  const gridContainer = document.getElementById("grid-container");
  const cnfOutput = document.getElementById("cnf-output");

  const btnBeginner = document.getElementById("btn-beginner");
  const btnIntermediate = document.getElementById("btn-intermediate");
  const btnAdvanced = document.getElementById("btn-advanced");
  const btnSolve = document.getElementById("btn-solve");
  const btnClear = document.getElementById("btn-clear");

  // --- Built-in puzzles ----------------------------------------------------

  // 81-character strings, digits 1–9 and '.' for blanks.
  const PUZZLES = {
    beginner:
      "53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79",
    // The intermediate puzzle may or may not be uniquely solvable; that's fine for SAT.
    intermediate:
      "1....7.9.3..2..8..9..1...2.5..9.3..1..8.6..4..2.5..7.8...6..4..4..1..3.2.7....5..",
    advanced:
      "..9.....18.2....7..3.6..5....1.9..3.5..3.7..8.4..1.6....8..2.4..7....1.92.....8..",
  };

  // --- State ---------------------------------------------------------------

  let isSyncing = false; // prevent textarea↔grid feedback loops
  /** @type {HTMLInputElement[][]} */
  let gridInputs = [];

  // --- Helpers -------------------------------------------------------------

  /** Remove non sudoku chars; ensure exactly 81 chars, padding with '.' if short. */
  function normalizeTo81(text) {
    const chars = text.replace(/[^0-9.]/g, "");
    if (chars.length >= 81) return chars.slice(0, 81);
    return chars.padEnd(81, ".");
  }

  /** Convert 81-char puzzle string into a 9×9 array of strings ("", "1".."9"). */
  function puzzleStringToGrid(str81) {
    const grid = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const ch = str81[r * 9 + c];
        row.push(ch === "." || ch === "0" ? "" : ch);
      }
      grid.push(row);
    }
    return grid;
  }

  /** Read values from the 9×9 inputs and turn them into an 81-char string. */
  function gridToPuzzleString() {
    let s = "";
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = gridInputs[r][c].value.trim();
        s += v === "" ? "." : v;
      }
    }
    return s;
  }

  /** Format an 81-char string as 9 lines of 9 characters for the textarea. */
  function formatPuzzleForTextarea(str81) {
    const lines = [];
    for (let r = 0; r < 9; r++) {
      lines.push(str81.slice(r * 9, r * 9 + 9));
    }
    return lines.join("\n");
  }

  /** Mark givens based on current grid values. */
  function markGivens() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = gridInputs[r][c];
        if (cell.value !== "") {
          cell.classList.add("given");
          cell.classList.remove("solver-fill");
        } else {
          cell.classList.remove("given");
          cell.classList.remove("solver-fill");
        }
      }
    }
  }

  // --- Sync logic ----------------------------------------------------------

  /** Update the 9×9 grid from whatever is in the textarea. */
  function syncGridFromTextarea() {
    if (!textarea || gridInputs.length === 0) return;
    isSyncing = true;
    const norm = normalizeTo81(textarea.value);
    const grid = puzzleStringToGrid(norm);
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        gridInputs[r][c].value = grid[r][c];
      }
    }
    isSyncing = false;
  }

  /** Update the textarea whenever a grid cell changes. */
  function syncTextareaFromGrid() {
    if (!textarea || isSyncing) return;
    const str81 = gridToPuzzleString();
    textarea.value = formatPuzzleForTextarea(str81);
  }

  // --- Grid construction ---------------------------------------------------

  function buildGrid() {
    const table = document.createElement("table");
    table.className = "sudoku-grid";
    gridInputs = [];

    for (let r = 0; r < 9; r++) {
      const tr = document.createElement("tr");
      const rowInputs = [];

      for (let c = 0; c < 9; c++) {
        const td = document.createElement("td");

        // Thick borders between 3×3 blocks.
        if ((c + 1) % 3 === 0 && c !== 8) {
          td.classList.add("block-border-right");
        }
        if ((r + 1) % 3 === 0 && r !== 8) {
          td.classList.add("block-border-bottom");
        }

        const input = document.createElement("input");
        input.setAttribute("inputmode", "numeric");
        input.setAttribute("maxlength", "1");

        input.addEventListener("input", (e) => {
          const cell = e.target;
          // Allow only digits 1–9.
          const v = cell.value.replace(/[^1-9]/g, "");
          cell.value = v;

          // Manual edits are not "givens" or solver-fills by default.
          cell.classList.remove("given");
          cell.classList.remove("solver-fill");

          syncTextareaFromGrid();
        });

        td.appendChild(input);
        tr.appendChild(td);
        rowInputs.push(input);
      }

      table.appendChild(tr);
      gridInputs.push(rowInputs);
    }

    gridContainer.innerHTML = "";
    gridContainer.appendChild(table);
  }

  // --- Preset puzzles ------------------------------------------------------

  function loadPuzzle(key) {
    const raw = PUZZLES[key];
    if (!raw) return;
    const norm = normalizeTo81(raw);
    const formatted = formatPuzzleForTextarea(norm);
    textarea.value = formatted;
    syncGridFromTextarea();
    markGivens();
  }

  function clearAll() {
    if (textarea) textarea.value = "";
    if (cnfOutput) cnfOutput.textContent = "";
    for (let r = 0; r < gridInputs.length; r++) {
      for (let c = 0; c < gridInputs[r].length; c++) {
        const cell = gridInputs[r][c];
        cell.value = "";
        cell.classList.remove("given");
        cell.classList.remove("solver-fill");
      }
    }
  }

  // --- SAT integration helpers --------------------------------------------

  function getEncoderAndSolver() {
    const encoder =
      window.encodeSudokuToCNF ||
      window.sudokuToCNF ||
      window.encodeSudoku ||
      null;

    const solver =
      window.solveSAT ||
      window.solveSat ||
      window.tinySolve ||
      null;

    return { encoder, solver };
  }

  function handleSolveClick() {
    if (!textarea) return;

    const chars = textarea.value.replace(/[^0-9.]/g, "");
    if (chars.length !== 81) {
      alert(
        "Please enter a complete puzzle (81 characters using digits 1–9 and . or 0 for blanks)."
      );
      return;
    }

    const { encoder, solver } = getEncoderAndSolver();
    if (!encoder || !solver) {
      alert(
        "Sudoku encoder/solver functions not found.\n\n" +
          "Make sure:\n" +
          "- sudoku-encode.js defines window.encodeSudokuToCNF(board).\n" +
          "- tinySat.js defines window.solveSAT(cnf)."
      );
      return;
    }

    const grid = puzzleStringToGrid(chars).map((row) =>
      row.map((ch) => (ch === "" ? 0 : parseInt(ch, 10)))
    );

    try {
      const cnf = encoder(grid);
      const result = solver(cnf);

      if (!result || !result.model) {
        alert("No solution found by SAT solver.");
        return;
      }

      if (cnfOutput) {
        cnfOutput.textContent =
          typeof cnf === "string" ? cnf : JSON.stringify(cnf, null, 2);
      }

      // If the solver returns a 9×9 numeric model, display it.
      if (Array.isArray(result.model) && result.model.length === 9) {
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            const cell = gridInputs[r][c];
            const v = result.model[r][c];
            cell.value = v ? String(v) : "";
            if (!cell.classList.contains("given")) {
              cell.classList.add("solver-fill");
            } else {
              cell.classList.remove("solver-fill");
            }
          }
        }
        syncTextareaFromGrid();
      }
      // Otherwise, we assume tinySat.js / sudoku-encode.js already do
      // their own UI printing based on 'result' and 'cnf'.
    } catch (err) {
      console.error(err);
      alert("Error during SAT solving. See console for details.");
    }
  }

  // --- Init ---------------------------------------------------------------

  function init() {
    if (!textarea || !gridContainer) {
      console.error("Sudoku SAT: required DOM elements not found.");
      return;
    }

    buildGrid();

    textarea.addEventListener("input", () => {
      syncGridFromTextarea();
      // User-edited puzzles have no default givens; leave classes alone.
    });

    if (btnBeginner)
      btnBeginner.addEventListener("click", () => loadPuzzle("beginner"));
    if (btnIntermediate)
      btnIntermediate.addEventListener("click", () => loadPuzzle("intermediate"));
    if (btnAdvanced)
      btnAdvanced.addEventListener("click", () => loadPuzzle("advanced"));
    if (btnSolve) btnSolve.addEventListener("click", handleSolveClick);
    if (btnClear) btnClear.addEventListener("click", clearAll);

    // Load a friendly puzzle by default and mark its givens.
    loadPuzzle("beginner");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
