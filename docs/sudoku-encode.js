(function (global) {
  "use strict";

  /**
   * Map (row, col, digit) to a SAT variable id in 1..729.
   * row, col are 0-based (0..8), digit is 1..9.
   */
  function sudokuVar(row, col, digit) {
    return row * 81 + col * 9 + digit;
  }

  /**
   * Parse a Sudoku text representation into a 9×9 board.
   * - Accepts digits 1–9, '.' or '0' for blanks.
   * - Ignores whitespace and newlines.
   * Returns: board[row][col] = 0 (blank) or 1..9.
   */
  function parseSudokuString(text) {
    const chars = text.replace(/\s+/g, "");
    if (chars.length !== 81) {
      throw new Error("Expected 81 characters (digits 1–9 or . / 0 for blanks).");
    }

    const board = [];
    let k = 0;

    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        const ch = chars[k++];
        if (ch === "." || ch === "0") {
          row.push(0);
        } else if (/[1-9]/.test(ch)) {
          row.push(parseInt(ch, 10));
        } else {
          throw new Error("Invalid character in puzzle: '" + ch + "'");
        }
      }
      board.push(row);
    }
    return board;
  }

  /**
   * Encode Sudoku constraints + givens into CNF.
   *
   * Returns:
   *   {
   *     clauses: number[][],
   *     numVars: 729
   *   }
   */
  function encodeSudokuToCNF(board) {
    const clauses = [];
    const numVars = 9 * 9 * 9; // 729

    // 1. Cell constraints: each cell has exactly one digit (1..9).
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        // At least one digit
        const atLeast = [];
        for (let d = 1; d <= 9; d++) {
          atLeast.push(sudokuVar(r, c, d));
        }
        clauses.push(atLeast);

        // At most one digit
        for (let d1 = 1; d1 <= 9; d1++) {
          for (let d2 = d1 + 1; d2 <= 9; d2++) {
            clauses.push([-sudokuVar(r, c, d1), -sudokuVar(r, c, d2)]);
          }
        }
      }
    }

    // 2. Row constraints: for each row and digit, digit appears exactly once.
    for (let r = 0; r < 9; r++) {
      for (let d = 1; d <= 9; d++) {
        // At least once in the row
        const atLeast = [];
        for (let c = 0; c < 9; c++) {
          atLeast.push(sudokuVar(r, c, d));
        }
        clauses.push(atLeast);

        // At most once in the row
        for (let c1 = 0; c1 < 9; c1++) {
          for (let c2 = c1 + 1; c2 < 9; c2++) {
            clauses.push([-sudokuVar(r, c1, d), -sudokuVar(r, c2, d)]);
          }
        }
      }
    }

    // 3. Column constraints: for each column and digit, digit appears exactly once.
    for (let c = 0; c < 9; c++) {
      for (let d = 1; d <= 9; d++) {
        const atLeast = [];
        for (let r = 0; r < 9; r++) {
          atLeast.push(sudokuVar(r, c, d));
        }
        clauses.push(atLeast);

        for (let r1 = 0; r1 < 9; r1++) {
          for (let r2 = r1 + 1; r2 < 9; r2++) {
            clauses.push([-sudokuVar(r1, c, d), -sudokuVar(r2, c, d)]);
          }
        }
      }
    }

    // 4. Block constraints: for each 3×3 block and digit, digit appears exactly once.
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        for (let d = 1; d <= 9; d++) {
          const atLeast = [];
          const cells = [];

          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const row = br * 3 + r;
              const col = bc * 3 + c;
              const v = sudokuVar(row, col, d);
              atLeast.push(v);
              cells.push(v);
            }
          }

          clauses.push(atLeast);

          // At most once inside the block
          for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) {
              clauses.push([-cells[i], -cells[j]]);
            }
          }
        }
      }
    }

    // 5. Givens (clues) from the input board: unit clauses.
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const value = board[r][c];
        if (value >= 1 && value <= 9) {
          clauses.push([sudokuVar(r, c, value)]);
        }
      }
    }

    return { clauses, numVars };
  }

  /**
   * Decode a SAT assignment back into a 9×9 Sudoku solution.
   * assignment is the array returned by tinySatSolve (1-based index).
   *
   * Returns: 9×9 array of digits (1..9).
   */
  function decodeSudokuFromAssignment(assignment) {
    const board = [];
    for (let r = 0; r < 9; r++) {
      const row = [];
      for (let c = 0; c < 9; c++) {
        let digit = 0;
        for (let d = 1; d <= 9; d++) {
          const v = sudokuVar(r, c, d);
          if (assignment[v] === 1) {
            digit = d;
            break;
          }
        }
        if (digit === 0) {
          throw new Error(
            "Decoded assignment is inconsistent (cell with no true digit)."
          );
        }
        row.push(digit);
      }
      board.push(row);
    }
    return board;
  }

  // Export globals for browser
  global.sudokuVar = sudokuVar;
  global.parseSudokuString = parseSudokuString;
  global.encodeSudokuToCNF = encodeSudokuToCNF;
  global.decodeSudokuFromAssignment = decodeSudokuFromAssignment;
})(this);
