import { solveSAT } from "./tinySat.js";

export function solveCNF(clauses, numVars) {
  const model = solveSAT(clauses, numVars);
  if (model === null) {
    return { sat: false, model: null };
  }
  return { sat: true, model };
}

