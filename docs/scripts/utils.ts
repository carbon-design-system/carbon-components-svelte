import fs from "node:fs";
import { COMPONENTS_PATH, PAGE_EXTENSION } from "./constants";

/** Component names from the page files in the components docs directory, sorted. */
export function getComponentNames(): string[] {
  return fs
    .readdirSync(COMPONENTS_PATH)
    .filter((f) => f.endsWith(PAGE_EXTENSION))
    .map((f) => f.slice(0, -PAGE_EXTENSION.length))
    .sort((a, b) => a.localeCompare(b));
}
