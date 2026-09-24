import { readdirSync } from "node:fs";
import { join } from "node:path";

/** Lists every `.scss` file under `dir`, recursively. */
export function scssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return scssFiles(file);
    return entry.name.endsWith(".scss") ? [file] : [];
  });
}
