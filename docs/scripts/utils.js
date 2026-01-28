// @ts-check
import fs from "node:fs";
import { COMPONENTS_PATH } from "./constants.js";

/**
 * Component names from .svx files in the components docs directory, sorted.
 * @returns {string[]}
 */
export function getComponentNames() {
  const files = fs.readdirSync(COMPONENTS_PATH);
  return files
    .filter((f) => f.endsWith(".svx"))
    .map((f) => f.split(".")[0])
    .sort((a, b) => a.localeCompare(b));
}
