# 🧩 Sudoku SAT Solver (Browser Version)

This project contains a fully working **Sudoku solver based on Boolean SAT 
solving**, with a clean interactive web UI.  
Everything runs **entirely in the browser**, using:

- A custom DPLL SAT solver (`tinySat.js`)
- A Sudoku → CNF encoder (`sudoku-encode.js`)
- A dynamic UI (`sudoku-app.js`)
- Live textarea ↔ 9×9 grid synchronization
- Blue highlighting for solver-filled digits
- Beginner / Intermediate / Advanced puzzle presets
- CNF debug output for teaching and experimentation

A complete demo is published via GitHub Pages:

**👉 https://stevex24.github.io/sat_solvers/**

---

## 🔧 How It Works

### 1. Sudoku → CNF encoding  
`docs/sudoku-encode.js` generates about **11,000 CNF clauses** encoding:

- Each cell has exactly one digit  
- Each digit appears once per row  
- Once per column  
- Once per 3×3 block  
- Givens become unit clauses  

The encoder returns:

```js
{
  clauses: [...],
  numVars: 729
}
2. SAT Solving
docs/tinySat.js implements a pure JavaScript DPLL solver:

Unit propagation

Recursive backtracking

First-unassigned-variable selection

Full propagation after each guess

Sudoku is small enough that even this minimal solver is fast.

3. Decoding SAT → Sudoku
decodeSudokuFromAssignment() converts the SAT model into a 9×9 number 
grid, which updates the UI.

🎮 Live Demo
Try the solver directly in your browser:

➡️ https://stevex24.github.io/sat_solvers/

You can:

Load preset puzzles

Paste or type puzzles into the textarea

Modify individual cells

Solve instantly using SAT

Inspect the CNF under "CNF (debug)"

🗂 File Structure
bash
Copy code
docs/
  index.html          ← Main UI
  sudoku-app.js       ← UI logic + live sync + coloring
  sudoku-encode.js    ← Sudoku → CNF encoder
  tinySat.js          ← DPLL SAT solver
The /docs folder is served directly via GitHub Pages.

✨ Features
✔ Beginner / Intermediate / Advanced puzzle buttons
Loads three fixed puzzles as a starting point.

✔ Textarea ↔ Grid live synchronization
Type into the textarea or grid—both stay in sync automatically.

✔ Givens vs Solver-Filled Coloring
Givens: bold black

Solver-filled digits: bold blue

This visually distinguishes original puzzle clues from SAT-generated 
values.

✔ CNF Debugging
A full pretty-printed CNF object is shown after solving.

✔ Pure JavaScript, no dependencies
No build tools, no server, no libraries—just open the /docs folder or view 
online.

🚀 Running Locally
Clone the repo:

bash
Copy code
git clone https://github.com/stevex24/sat_solvers.git
cd sat_solvers
Start a local web server:

bash
Copy code
python3 -m http.server 8000
Then open:

bash
Copy code
http://localhost:8000/docs/
🧪 Example Puzzle (Beginner)
Copy code
53..7....
6..195...
.98....6.
8...6...3
4..8.3..1
7...2...6
.6....28.
...419..5
....8..79
🔮 Future Extensions (ideas)
Step-by-step SAT solving visualization

Puzzle difficulty evaluation

Automatic puzzle generator via SAT

Solving multiple solutions / counting solutions

Import/export in common Sudoku formats

Keyboard-only navigation

Error highlighting (red for conflicts)

If you'd like help adding any of these, open an issue or ask the 
assistant.

📜 License
MIT License.
Free to modify, extend, or incorporate into other projects.

yaml
Copy code

---

# 🎉 The README is ready!

If you'd like:

- A screenshot banner  
- A “Live Demo” badge  
- A collapsible CNF example  
- A minimal version for classroom handouts  
- A more academic/technical version explaining the encoding

…just say the word!
