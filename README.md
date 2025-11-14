# SAT Solver Assignment  
CMPM 118 - SAT Solving with JavaScript  
Author: Steve Cross

This project implements:

1. A simple SAT solver in JavaScript (tinySat.js)
2. A CNF encoding framework (sat.js)
3. A SAT-based solution to a logic puzzle (the "pets puzzle")
4. A SAT-based Sudoku solver with optional solution counting
5. A command-line interface for running both solvers

Everything is implemented from scratch using only JavaScript and Node.js.
No external SAT solver libraries are used.

=====================================================================

## Project Structure

sat_solvers/
|
|-- src/
|    |-- tinySat.js          # Simple DPLL-style SAT solver
|    |-- sat.js              # Wrapper: solveCNF(clauses, numVars)
|    |-- pets.js             # SAT encoding for the pets puzzle
|    |-- sudoku.js           # Sudoku to CNF encoding and solver
|    |
|    `-- util/
|         |-- decodeSudoku.js  # Convert SAT model to 9x9 grid
|         `-- printGrid.js     # Pretty-print solved Sudoku
|
|-- puzzles/
|     `-- example-sudoku.txt   # Sample Sudoku input
|
|-- package.json
`-- README.md

=====================================================================

# Part 1 - Pets Puzzle

Puzzle description:
Four children (Bob, Mary, Cathy, Sue) each own one pet
(Cat, Dog, Bird, Fish).

Clues:
- The boy has a dog.
- Sue has a pet with two legs.
- Mary does not have a fish.

Encoding:
Each child/pet pair is encoded as a Boolean variable:

1-4:    Bob-[Cat,Dog,Bird,Fish]  
5-8:    Mary-[Cat,Dog,Bird,Fish]  
9-12:   Cathy-[Cat,Dog,Bird,Fish]  
13-16:  Sue-[Cat,Dog,Bird,Fish]

Constraints:
- Each child has exactly one pet.
- Each pet is assigned to exactly one child.
- Clue constraints applied as unit clauses.

To run the solver:

    node src/pets.js

Expected output:

    Satisfiable: true

    Solution:
    Bob-Dog = TRUE
    Mary-Cat = TRUE
    Cathy-Fish = TRUE
    Sue-Bird = TRUE

=====================================================================

# Part 2 - Sudoku via SAT

The Sudoku solver converts a 9x9 puzzle into CNF and uses the SAT solver
to find a valid solution.

Input format (example-sudoku.txt):
9 lines of digits. Zero (0) indicates an empty cell.

To run:

    node src/sudoku.js

Example output:

    Solved Sudoku:

    5 3 4 6 7 8 9 1 2
    6 7 2 1 9 5 3 4 8
    1 9 8 3 4 2 5 6 7
    8 5 9 7 6 1 4 2 3
    4 2 6 8 5 3 7 9 1
    7 1 3 9 2 4 8 5 6
    9 6 1 5 3 7 2 8 4
    2 8 7 4 1 9 6 3 5
    3 4 5 2 8 6 1 7 9

=====================================================================

# Optional: Count All Sudoku Solutions

To enumerate all solutions:

    node src/sudoku.js --count

This will print all solutions and display the total number found.

=====================================================================

# Requirements

- Node.js (version 18 or later recommended)
- No external libraries are required

=====================================================================

# Installation

    git clone https://github.com/stevex24/sat_solvers.git
    cd sat_solvers
    node src/pets.js
    node src/sudoku.js

=====================================================================

# Notes

This project was created for the CMPM 118 assignment on SAT solvers.  
It demonstrates:

- Constraint encoding
- CNF formulation
- Building a SAT solver from scratch
- Applying SAT techniques to practical problems

=====================================================================

End of README

