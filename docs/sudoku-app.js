(function () {
  "use strict";

  const DEFAULT_PUZZLE = [
    "53..7....",
    "6..195...",
    ".98....6.",
    "8...6...3",
    "4..8.3..1",
    "7...2...6",
    ".6....28.",
    "...419..5",
    "....8..79",
  ].join("\n");

  const TEXTAREA_ID = "puzzle-input";
  const GRID_ID = "sudoku-grid";
  const STATUS_ID = "status";
  const CNF_DEBUG_ID = "cnf-debug";

  let gridCells = []; // 2D array [row][col] -> { wrapper, input }
  let givenMask = []; // 2D boolean: true if originally given

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    const textarea = $(TEXTAREA_ID);
    const grid = $(GRID_ID);

    if (!textarea || !grid) return;

    // Ensure default puzzle is in the textarea
    textarea.value = DEFAULT_PUZZLE;

    buildGrid(grid);
    loadPuzzleIntoGrid(DEFAULT_PUZZLE);

    // Wire buttons
    const btnExample = $("btn-example");
    const btnSolve = $("btn-solve");
    const btnClear = $("btn-clear");

    if (btnExample) {
      btnExample.addEventListener("click", () => {
        textarea.value = DEFAULT_PUZZLE;
        loadPuzzleIntoGrid(DEFAULT_PUZZLE);
        setStatus("Example puzzle loaded.", "ok");
      });
    }

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        textarea.value = "";
        clearGrid();
        setStatus("Grid cleared. Paste or type a new puzzle.", "");
        const cnfEl = $(CNF_DEBUG_ID);
        if (cnfEl) cnfEl.textContent = "";
      });
    }

    if (btnSolve) {
      btnSolve.addEventListener("click", () => {
        const puzzleText = textarea.value;
        setStatus("Solving with SAT...", "");
        // Allow the status text to paint before heavy work
        setTimeout(() => {
          solvePuzzle(puzzleText);
        }, 10);
      });
    }
  }

  function buildGrid(gridEl) {
    gridCells = [];
    givenMask = [];

    gridEl.innerHTML = "";

    for (let r = 0; r < 9; r++) {
      const rowCells = [];
      const rowGiven = [];

      for (let c = 0; c < 9; c++) {
        const cellWrapper = document.createElement("div");
        cellWrapper.className = "sudoku-cell";

        // Bold borders between 3×3 blocks
        if (c === 2 || c === 5) cellWrapper.classList.add("box-right");
        if (r === 2 || r === 5) cellWrapper.classList.add("box-bottom");

        const input = document.createElement("input");
        input.type = "text";
        input.maxLength = 1;
        input.setAttribute("inputmode", "numeric");
        input.dataset.row = String(r);
        input.dataset.col = String(c);

        cellWrapper.appendChild(input);
        gridEl.appendChild(cellWrapper);

        rowCells.push({ wrapper: cellWrapper, input });
        rowGiven.push(false);
      }

      gridCells.push(rowCells);
      givenMask.push(rowGiven);
    }
  }

  function clearGrid() {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = gridCells[r][c];
        if (!cell) continue;
        cell.input.value = "";
        cell.wrapper.classList.remove("given", "solved");
      }
    }
  }

  function loadPuzzleIntoGrid(text) {
    clearGrid();

    let board;
    try {
      board = parseSudokuString(text);
    } catch (e) {
      // If parsing fails, just leave the grid empty
      setStatus("Could not parse puzzle: " + e.message, "error");
      return;
    }

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r][c];
        const cell = gridCells[r][c];
        if (!cell) continue;

        if (val >= 1 && val <= 9) {
          cell.input.value = String(val);
          cell.wrapper.classList.add("given");
          cell.wrapper.classList.remove("solved");
          givenMask[r][c] = true;
        } else {
          cell.input.value = "";
          cell.wrapper.classList.remove("given", "solved");
          givenMask[r][c] = false;
        }
      }
    }
  }

  function solvePuzzle(text) {
    let board;
    try {
      board = parseSudokuString(text);
    } catch (e) {
      setStatus("Error: " + e.message, "error");
      return;
    }

    let encoded;
    try {
      encoded = encodeSudokuToCNF(board);
    } catch (e) {
      setStatus("Encoding error: " + e.message, "error");
      return;
    }

    const { clauses, numVars } = encoded;

    // Debug CNF stats
    const cnfEl = $(CNF_DEBUG_ID);
    if (cnfEl) {
      cnfEl.textContent =
        "vars: " +
        numVars +
        "\nclauses: " +
        clauses.length +
        "\n\n(First few clauses)\n" +
        clauses
          .slice(0, 10)
          .map((cl) => cl.join(" "))
          .join("\n");
    }

    // Solve using tinySat
    let assignment;
    try {
      assignment = tinySatSolve(clauses, numVars);
    } catch (e) {
      setStatus("SAT solver error: " + e.message, "error");
      return;
    }

    if (!assignment) {
      setStatus("Puzzle is UNSAT (no solution found).", "error");
      return;
    }

    // Decode assignment into finished board
    let solution;
    try {
      solution = decodeSudokuFromAssignment(assignment);
    } catch (e) {
      setStatus("Decode error: " + e.message, "error");
      return;
    }

    // Display solution in 9×9 grid
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = gridCells[r][c];
        if (!cell) continue;
        const val = solution[r][c];
        cell.input.value = String(val);

        if (givenMask[r][c]) {
          cell.wrapper.classList.add("given");
          cell.wrapper.classList.remove("solved");
        } else {
          cell.wrapper.classList.add("solved");
        }
      }
    }

    setStatus("Solved successfully with SAT.", "ok");
  }

  function setStatus(message, kind) {
    const el = $(STATUS_ID);
    if (!el) return;
    el.textContent = message;
    el.classList.remove("error", "ok");
    if (kind === "error") el.classList.add("error");
    if (kind === "ok") el.classList.add("ok");
  }

  // Initialize once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

