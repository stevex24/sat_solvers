import { solveCNF } from "./sat.js";

//
// Variable numbering (Cat, Dog, Bird, Fish):
// 1 BC, 2 BD, 3 BB, 4 BF
// 5 MC, 6 MD, 7 MB, 8 MF
// 9 CC, 10 CD, 11 CB, 12 CF
// 13 SC, 14 SD, 15 SB, 16 SF
//

const clauses = [

  // At least one pet per child
  [1,2,3,4],
  [5,6,7,8],
  [9,10,11,12],
  [13,14,15,16],

  // At most one per child (pairwise)
  [-1,-2],[-1,-3],[-1,-4],[-2,-3],[-2,-4],[-3,-4],
  [-5,-6],[-5,-7],[-5,-8],[-6,-7],[-6,-8],[-7,-8],
  [-9,-10],[-9,-11],[-9,-12],[-10,-11],[-10,-12],[-11,-12],
  [-13,-14],[-13,-15],[-13,-16],[-14,-15],[-14,-16],[-15,-16],

  // At least one child per pet
  [1,5,9,13],
  [2,6,10,14],
  [3,7,11,15],
  [4,8,12,16],

  // At most one child per pet (pairwise)
  [-1,-5],[-1,-9],[-1,-13],[-5,-9],[-5,-13],[-9,-13],
  [-2,-6],[-2,-10],[-2,-14],[-6,-10],[-6,-14],[-10,-14],
  [-3,-7],[-3,-11],[-3,-15],[-7,-11],[-7,-15],[-11,-15],
  [-4,-8],[-4,-12],[-4,-16],[-8,-12],[-8,-16],[-12,-16],

  // Clues
  [2],    // Bob has Dog
  [15],   // Sue has Bird
  [-8]    // Mary does NOT have Fish
];

const numVars = 16;

const result = solveCNF(clauses, numVars);

console.log("Satisfiable:", result.sat);
console.log("\nSolution:");

const names = {
  1:"Bob-Cat",2:"Bob-Dog",3:"Bob-Bird",4:"Bob-Fish",
  5:"Mary-Cat",6:"Mary-Dog",7:"Mary-Bird",8:"Mary-Fish",
  9:"Cathy-Cat",10:"Cathy-Dog",11:"Cathy-Bird",12:"Cathy-Fish",
  13:"Sue-Cat",14:"Sue-Dog",15:"Sue-Bird",16:"Sue-Fish"
};

for (let k=1; k<=16; k++) {
  if (result.model[k]) console.log(names[k], "= TRUE");
}

