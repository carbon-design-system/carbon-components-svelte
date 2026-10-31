/**
 * Rules for what the published npm tarball may contain, kept free of the
 * `npm pack` call so they are unit-testable. scripts/check-package-contents.ts
 * feeds this the file list from `npm pack --dry-run --json`.
 *
 * 0.110.0 through 0.112.0 shipped sveld's parse cache
 * (src/node_modules/.cache/sveld/parse-cache.json, ~1.7 MB) because
 * `files: ["src"]` packs everything under src/. The negated `files` entries
 * in package.json now exclude it; this guard catches the next tool that
 * writes somewhere under a published directory.
 *
 * Missing files are a separate, opt-in check: the build outputs are
 * gitignored, so an unbuilt tree packs without them. Only the release
 * workflow builds first, so only it asks for them (`requireBuilt`).
 */

export type PackedFile = { path: string; size: number };

/** Path segments that only ever hold tool output, never package source. */
const FORBIDDEN_SEGMENTS = new Set(["node_modules", ".cache"]);

const ALLOWED: RegExp[] = [
  /^package\.json$/,
  /^README\.md$/,
  /^LICENSE$/,
  /^telemetry\.yml$/,
  /^css\/[^/]+\.css$/,
  /^css\/css\.d\.ts$/,
  /^src\/.+\.(svelte|js|d\.ts)$/,
];

/** Build outputs a release tarball must contain, keyed by description. */
const REQUIRED: [string, RegExp][] = [
  ["css/*.css", /^css\/[^/]+\.css$/],
  ["src/**/*.svelte.d.ts", /^src\/.+\.svelte\.d\.ts$/],
  ["src/index.d.ts", /^src\/index\.d\.ts$/],
];

/**
 * Release builds (all themes, doc comments stripped) unpack to ~5.7 MB as of
 * 0.112.1, and ~6.6 MB with the `viz` subpackage (35 charts, their CSS, and
 * types). The budget leaves room for real source growth while still
 * tripping on an artifact the size of the parse cache.
 */
export const UNPACKED_SIZE_BUDGET = 7_500_000;

export function packageContentProblems(
  files: PackedFile[],
  unpackedSize: number,
  budget = UNPACKED_SIZE_BUDGET,
  { requireBuilt = false } = {},
): string[] {
  const problems: string[] = [];

  for (const { path, size } of files) {
    const segment = path.split("/").find((s) => FORBIDDEN_SEGMENTS.has(s));
    if (segment) {
      problems.push(`${path} (${size} B): contains a ${segment}/ segment`);
    } else if (!ALLOWED.some((pattern) => pattern.test(path))) {
      problems.push(`${path} (${size} B): not an expected package file`);
    }
  }

  if (requireBuilt) {
    for (const [description, pattern] of REQUIRED) {
      if (!files.some(({ path }) => pattern.test(path))) {
        problems.push(`no ${description} file: was the package built?`);
      }
    }
  }

  if (unpackedSize > budget) {
    problems.push(
      `unpacked size ${unpackedSize} B exceeds the ${budget} B budget`,
    );
  }

  return problems;
}
