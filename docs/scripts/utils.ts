import fs from "node:fs";
import { COMPONENTS_PATH, PAGE_EXTENSION, PAGES_PATH } from "./constants";

/** Component names from the page files in the components docs directory, sorted. */
export function getComponentNames(): string[] {
  return fs
    .readdirSync(COMPONENTS_PATH)
    .filter((f) => f.endsWith(PAGE_EXTENSION))
    .map((f) => f.slice(0, -PAGE_EXTENSION.length))
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Guide names from the page files directly under `src/pages` (the
 * components live in a subdirectory), sorted.
 */
export function getGuideNames(): string[] {
  return fs
    .readdirSync(PAGES_PATH)
    .filter((f) => f.endsWith(PAGE_EXTENSION))
    .map((f) => f.slice(0, -PAGE_EXTENSION.length))
    .sort((a, b) => a.localeCompare(b));
}
