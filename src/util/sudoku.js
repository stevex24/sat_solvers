import fs from "fs";
import { solveCNF } from "./sat.js";
import { decodeSudoku } from "./util/decodeSudoku.js";
import { printGrid } from "./util/printGrid.js";

const args = process.argv.slice(2);
const countAll = args.includes("--count");

const puzzle = fs.readFileSync("puzzles/example-sudoku.txt", "utf8")
  .trim()
  .split("\n")
  .map(row => row.trim().split("").map(c => Number(c)));

function varID(r,c,d){ return (r-1)*81 + (c-1)*9 + d; }

let clauses = [];

// Cell constraints
for (let r=1; r<=9; r++){
  for (let c=1; c<=9; c++){
    // At least one digit
    clauses.push(Array.from({length:9},(_,i)=>varID(r,c,i+1)));

    // At most one
    for (let d1=1; d1<=9; d1++)
      for (let d2=d1+1; d2<=9; d2++)
        clauses.push([-varID(r,c,d1), -varID(r,c,d2)]);
  }
}

// Row constraints
for (let r=1; r<=9; r++){
  for (let d=1; d<=9; d++){
    clauses.push(Array.from({length:9},(_,i)=>varID(r,i+1,d)));
    for (let c1=1; c1<=9; c1++)
      for (let c2=c1+1; c2<=9; c2++)
        clauses.push([-varID(r,c1,d), -varID(r,c2,d)]);
  }
}

// Column constraints
for (let c=1; c<=9; c++){
  for (let d=1; d<=9; d++){
    clauses.push(Array.from({length:9},(_,i)=>varID(i+1,c,d)));
    for (let r1=1; r1<=9; r1++)
      for (let r2=r1+1; r2<=9; r2++)
        clauses.push([-varID(r1,c,d), -varID(r2,c,d)]);
  }
}

// Block constraints
for (let br=0; br<3; br++){
  for (let bc=0; bc<3; bc++){
    for (let d=1; d<=9; d++){
      const cells = [];
      for (let r=1; r<=3; r++)
        for (let c=1; c<=3; c++)
          cells.push(varID(3*br+r, 3*bc+c, d));

      clauses.push(cells);

      for (let i=0; i<9; i++)
        for (let j=i+1; j<9; j++)
          clauses.push([-cells[i], -cells[j]]);
    }
  }
}

// Add puzzle clues
for (let r=1; r<=9; r++){
  for (let c=1; c<=9; c++){
    if (puzzle[r-1][c-1] !== 0) {
      clauses.push([ varID(r,c,puzzle[r-1][c-1]) ]);
    }
  }
}

if (!countAll) {
  const sol = solveCNF(clauses);
  if (!sol.sat) return console.log("No solution.");
  console.log("Solved Sudoku:\n");
  printGrid(decodeSudoku(sol.model));
  process.exit();
}

// Enumerate all solutions (Knuth-style)
let numVars = 9*9*9;
let total = 0;

while (true) {
  let sol = solveCNF(clauses);
  if (!sol.sat) break;

  total++;
  console.log(`Solution ${total}:`);
  printGrid(decodeSudoku(sol.model));
  console.log("");

  // Blocking clause
  const block = [];
  for (let v=1; v<=numVars; v++)
    block.push(sol.model[v] ? -v : v);
  clauses.push(block);
}

console.log("Total solutions:", total);

