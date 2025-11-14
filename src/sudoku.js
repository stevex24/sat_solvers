import fs from "fs";
import { solveCNF } from "./sat.js";
import { decodeSudoku } from "./util/decodeSudoku.js";
import { printGrid } from "./util/printGrid.js";

// Helper: pretty-print the initial puzzle
function printInitialGrid(lines) {
  console.log("Initial Sudoku Puzzle:\n");
  for (const line of lines) {
    console.log(line.split("").join(" "));
  }
  console.log("\n-----------------------------------------\n");
}

// -------------------------------------------------------------------
// Read puzzle from file
// -------------------------------------------------------------------
const lines = fs
  .readFileSync("puzzles/example-sudoku.txt", "utf8")
  .trim()
  .split(/\s+/);

// Print the input puzzle
printInitialGrid(lines);

// -------------------------------------------------------------------
// Build CNF encoding
// -------------------------------------------------------------------

function varNum(r, c, d) {
  // r,c,d all in [1..9]
  return (r - 1) * 81 + (c - 1) * 9 + d;
}

const clauses = [];
const numVars = 9 * 9 * 9;

// Each cell has at least one digit
for (let r = 1; r <= 9; r++) {
  for (let c = 1; c <= 9; c++) {
    const clause = [];
    for (let d = 1; d <= 9; d++) {
      clause.push(varNum(r, c, d));
    }
    clauses.push(clause);
  }
}

// Each cell has at most one digit
for (let r = 1; r <= 9; r++) {
  for (let c = 1; c <= 9; c++) {
    for (let d1 = 1; d1 <= 9; d1++) {
      for (let d2 = d1 + 1; d2 <= 9; d2++) {
        clauses.push([-varNum(r, c, d1), -varNum(r, c, d2)]);
      }
    }
  }
}

// Row constraints
for (let r = 1; r <= 9; r++) {
  for (let d = 1; d <= 9; d++) {
    const clause = [];
    for (let c = 1; c <= 9; c++) {
      clause.push(varNum(r, c, d));
    }
    clauses.push(clause);

    for (let c1 = 1; c1 <= 9; c1++) {
      for (let c2 = c1 + 1; c2 <= 9; c2++) {
        clauses.push([-varNum(r, c1, d), -varNum(r, c2, d)]);
      }
    }
  }
}

// Column constraints
for (let c = 1; c <= 9; c++) {
  for (let d = 1; d <= 9; d++) {
    const clause = [];
    for (let r = 1; r <= 9; r++) {
      clause.push(varNum(r, c, d));
    }
    clauses.push(clause);

    for (let r1 = 1; r1 <= 9; r1++) {
      for (let r2 = r1 + 1; r2 <= 9; r2++) {
        clauses.push([-varNum(r1, c, d), -varNum(r2, c, d)]);
      }
    }
  }
}

// Block constraints (3x3)
for (let br = 0; br < 3; br++) {
  for (let bc = 0; bc < 3; bc++) {
    for (let d = 1; d <= 9; d++) {
      const clause = [];
      for (let r = 1 + br * 3; r <= 3 + br * 3; r++) {
        for (let c = 1 + bc * 3; c <= 3 + bc * 3; c++) {
          clause.push(varNum(r, c, d));
        }
      }
      clauses.push(clause);

      const cells = [];
      for (let r = 1 + br * 3; r <= 3 + br * 3; r++) {
        for (let c = 1 + bc * 3; c <= 3 + bc * 3; c++) {
          cells.push([r, c]);
        }
      }

      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const [r1, c1] = cells[i];
          const [r2, c2] = cells[j];
          clauses.push([-varNum(r1, c1, d), -varNum(r2, c2, d)]);
        }
      }
    }
  }
}

// -------------------------------------------------------------------
// Prefilled digits (input puzzle)
// -------------------------------------------------------------------

for (let r = 1; r <= 9; r++) {
  const row = lines[r - 1];
  for (let c = 1; c <= 9; c++) {
    const ch = row[c - 1];
    if (ch !== "0") {
      const d = Number(ch);
      clauses.push([varNum(r, c, d)]);
    }
  }
}

// -------------------------------------------------------------------
// Solve or enumerate
// -------------------------------------------------------------------

const countAll = process.argv.includes("--count");

if (!countAll) {
  const sol = solveCNF(clauses, numVars);
  if (!sol.sat) {
    console.log("No solution.");
    process.exit(0);
  }

  console.log("Solved Sudoku:\n");
  printGrid(decodeSudoku(sol.model));
  process.exit(0);
}

// Count-all mode
let solutionCount = 0;
let sol;

function blockSolution(model) {
  // Block the EXACT assignment for this solution
  const used = [];
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 9; c++) {
      const d = model[varNum(r, c, 1)] ? 1 :
                model[varNum(r, c, 2)] ? 2 :
                model[varNum(r, c, 3)] ? 3 :
                model[varNum(r, c, 4)] ? 4 :
                model[varNum(r, c, 5)] ? 5 :
                model[varNum(r, c, 6)] ? 6 :
                model[varNum(r, c, 7)] ? 7 :
                model[varNum(r, c, 8)] ? 8 : 9;
      used.push(varNum(r, c, d));
    }
  }
  // Add a clause blocking this exact assignment
  clauses.push(used.map((v) => -v));
}

while (true) {
  sol = solveCNF(clauses, numVars);
  if (!sol.sat) break;

  solutionCount++;
  console.log("Solution", solutionCount + ":\n");
  printGrid(decodeSudoku(sol.model));
  blockSolution(sol.model);
}

console.log("Total solutions:", solutionCount);

