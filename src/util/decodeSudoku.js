export function decodeSudoku(model) {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));

  const id = (r,c,d) => (r-1)*81 + (c-1)*9 + d;

  for (let r=1; r<=9; r++) {
    for (let c=1; c<=9; c++) {
      for (let d=1; d<=9; d++) {
        if (model[id(r,c,d)]) {
          grid[r-1][c-1] = d;
        }
      }
    }
  }

  return grid;
}

