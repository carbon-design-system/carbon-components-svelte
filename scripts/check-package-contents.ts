/**
 * Fails when the npm tarball would ship anything outside the expected set
 * (see scripts/lib/package-contents.ts). Runs in CI and before `npm publish`.
 * `--release` also fails when build outputs (css, types) are missing; pass it
 * only after `release:build`.
 *
 *   bun scripts/check-package-contents.ts [--release]
 */
import { $ } from "bun";
import {
  packageContentProblems,
  type PackedFile,
} from "./lib/package-contents";

const [pack] = (await $`npm pack --dry-run --json --ignore-scripts`
  .quiet()
  .json()) as [{ files: PackedFile[]; unpackedSize: number; size: number }];

const problems = packageContentProblems(
  pack.files,
  pack.unpackedSize,
  undefined,
  { requireBuilt: process.argv.includes("--release") },
);

console.log(
  `[check-package-contents] ${pack.files.length} files, ${pack.unpackedSize} B unpacked, ${pack.size} B packed`,
);

if (problems.length > 0) {
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
