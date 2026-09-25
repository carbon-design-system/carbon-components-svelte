/**
 * Fails when the npm tarball would ship anything outside the expected set
 * (see scripts/lib/package-contents.ts). Runs in CI and before `npm publish`.
 *
 *   bun scripts/check-package-contents.ts
 */
import { $ } from "bun";
import {
  type PackedFile,
  packageContentProblems,
} from "./lib/package-contents";

const [pack] = (await $`npm pack --dry-run --json --ignore-scripts`
  .quiet()
  .json()) as [{ files: PackedFile[]; unpackedSize: number; size: number }];

const problems = packageContentProblems(pack.files, pack.unpackedSize);

console.log(
  `[check-package-contents] ${pack.files.length} files, ${pack.unpackedSize} B unpacked, ${pack.size} B packed`,
);

if (problems.length > 0) {
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
