import { rmSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { emit } from "./emit";
import { createLocator, type Output } from "./output";

/**
 * Type-checks the `.svelte` components in a workspace without svelte-check.
 *
 *   bun scripts/typecheck --workspace tests
 *   bun scripts/typecheck --workspace src --tsconfig tsconfig.svelte-types.json --no-declarations
 *
 * Each component is turned into TypeScript (see `emit.ts`) under
 * `<workspace>/.typecheck`, next to a tsconfig that extends the workspace's.
 * `--checker` runs `bun check` (default), `tsgo` or `tsc` on it, and each
 * error maps back to its `.svelte` line. Errors in generated code are
 * dropped; `TYPECHECK_DEBUG=1` prints them. `--no-declarations` skips the
 * `X.d.svelte.ts` re-exports, so imports of `.svelte` files resolve to their
 * own `.svelte.d.ts` (as `src/` has, from sveld). `--output machine` prints
 * `ERROR "file" line:column "message" code` lines, with `file` relative to
 * the workspace. `--svelte` points at the
 * Svelte install to check against (its version and element typings), e.g.
 * `tests-svelte3/node_modules/svelte` with `--tsconfig
 * tests-svelte3/tsconfig.check.json`.
 */
const { values } = parseArgs({
  options: {
    workspace: { type: "string", default: "tests" },
    tsconfig: { type: "string" },
    checker: { type: "string", default: "bun" },
    "no-declarations": { type: "boolean", default: false },
    output: { type: "string", default: "human" },
    svelte: { type: "string", default: "node_modules/svelte" },
  },
});

/** `path(line,col): error TSxxxx: message`, as tsc, tsgo and `bun check` print. */
const DIAGNOSTIC = /^(.+?)\((\d+),(\d+)\): error (TS\d+): (.*)$/;
const CONTINUATION = /^\s+\S/;
/** Errors that stop a checker before it type-checks anything. */
const SYNTAX_ERROR =
  /\.typecheck\/.*error TS(1\d{3}|8\d{3}):|Stopped before type checking/;

const ROOT = resolve(import.meta.dirname, "../..");
const workspace = resolve(ROOT, values.workspace);
const baseConfig = resolve(
  ROOT,
  values.tsconfig ?? join(values.workspace, "tsconfig.json"),
);
const outDir = join(workspace, ".typecheck");
const genDir = join(outDir, "svelte");
const noDeclarations = values["no-declarations"];

const svelteMajor = Number(
  (
    (await Bun.file(resolve(ROOT, values.svelte, "package.json")).json()) as {
      version: string;
    }
  ).version.split(".")[0],
);

// Element typings: Svelte 4 and 5 ship svelte-html.d.ts, Svelte 3 doesn't.
const svelteHtml =
  svelteMajor === 3
    ? join(ROOT, "scripts/typecheck/svelte3-elements.d.ts")
    : resolve(ROOT, values.svelte, "svelte-html.d.ts");

/**
 * The `exclude` the base tsconfig ends up with (the nearest config in its
 * `extends` chain that sets one), as globs relative to the workspace.
 */
async function baseExclude(path: string): Promise<string[]> {
  const config = Bun.JSONC.parse(await Bun.file(path).text()) as {
    extends?: string;
    exclude?: string[];
  };
  if (config.exclude)
    return config.exclude.map((pattern) =>
      relative(workspace, resolve(dirname(path), pattern)),
    );
  return config.extends
    ? baseExclude(resolve(dirname(path), config.extends))
    : [];
}
const excluded = (await baseExclude(baseConfig))
  .filter((pattern) => !pattern.startsWith(".."))
  .map((pattern) => new Bun.Glob(pattern));

const started = performance.now();
rmSync(outDir, { recursive: true, force: true });

const files = [
  ...new Bun.Glob("**/*.svelte").scanSync({ cwd: workspace }),
].filter(
  (rel) =>
    !rel.includes("node_modules") &&
    !rel.startsWith(".") &&
    !excluded.some((glob) => glob.match(rel)),
);
const sources = await Promise.all(
  files.map((rel) => Bun.file(join(workspace, rel)).text()),
);

const outputs = new Map<
  string,
  { output: Output; source: string; svelte: string }
>();
const writes: Promise<number>[] = [];
let failed = 0;
files.forEach((rel, i) => {
  const path = join(workspace, rel);
  const genFrom = join(genDir, dirname(rel));
  let result: ReturnType<typeof emit>;
  try {
    result = emit(sources[i], {
      svelte: svelteMajor,
      // A relative import that leaves the workspace is relative to the
      // generated file's folder instead.
      rewriteImport(specifier) {
        if (!specifier.startsWith(".")) return;
        const target = resolve(dirname(path), specifier);
        if (target.startsWith(`${workspace}/`)) return;
        const next = relative(genFrom, target);
        return next.startsWith(".") ? next : `./${next}`;
      },
    });
  } catch (error) {
    failed++;
    console.error(`${relative(ROOT, path)}: ${(error as Error).message}`);
    return;
  }
  const name = rel.slice(rel.lastIndexOf("/") + 1, -".svelte".length);
  const genPath = join(
    genFrom,
    `++${name}.svelte.${result.isTs ? "ts" : "js"}`,
  );
  outputs.set(genPath, {
    output: result.out,
    source: sources[i],
    svelte: path,
  });
  writes.push(Bun.write(genPath, result.out.code));
  if (!noDeclarations)
    writes.push(
      Bun.write(
        join(genFrom, `${name}.d.svelte.ts`),
        `export { default } from "./++${name}.svelte.js";\nexport * from "./++${name}.svelte.js";\n`,
      ),
    );
});

const workspaceRel = relative(outDir, workspace);
const tsconfig = join(outDir, "tsconfig.json");
writes.push(
  Bun.write(
    tsconfig,
    JSON.stringify(
      {
        extends: relative(outDir, baseConfig),
        compilerOptions: {
          rootDirs: [workspaceRel, "svelte"],
          allowArbitraryExtensions: true,
          noEmit: true,
        },
        files: [join(ROOT, "scripts/typecheck/shims.d.ts"), svelteHtml].map(
          (path) => relative(outDir, path),
        ),
        include: noDeclarations ? ["svelte"] : [workspaceRel, "svelte"],
        exclude: [
          `${workspaceRel}/**/node_modules`,
          `${workspaceRel}/.svelte-check`,
          ...(await baseExclude(baseConfig)).map((p) => join(workspaceRel, p)),
        ],
      },
      null,
      2,
    ),
  ),
);
await Promise.all(writes);
const emitted = performance.now();

const commands: Record<string, string[]> = {
  bun: [process.execPath, "check", "-p", tsconfig, "--no-pretty", "--all"],
  tsgo: [
    join(ROOT, "node_modules/.bin/tsgo"),
    "-p",
    tsconfig,
    "--pretty",
    "false",
  ],
  tsc: [
    join(ROOT, "node_modules/.bin/tsc"),
    "-p",
    tsconfig,
    "--pretty",
    "false",
  ],
};
const command = commands[values.checker];
if (!command) throw new Error(`Unknown --checker ${values.checker}`);
const proc = Bun.spawn(command, { cwd: ROOT, stdout: "pipe", stderr: "pipe" });
const [stdout, stderr] = await Promise.all([
  new Response(proc.stdout).text(),
  new Response(proc.stderr).text(),
]);
await proc.exited;
const text = stdout + stderr;
const checked = performance.now();

// A syntax error in generated code stops the checker before it type-checks
// anything, so it's an emitter bug that must fail the run, not pass it.
const syntax = text.split("\n").filter((line) => SYNTAX_ERROR.test(line));
if (syntax.length) {
  console.error(syntax.slice(0, 20).join("\n"));
  console.error(
    "Generated code has syntax errors; fix scripts/typecheck/emit.ts.",
  );
  process.exit(2);
}

type Diagnostic = {
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
};
const raw: Diagnostic[] = [];
let continues = false;
for (const line of text.split("\n")) {
  const m = line.match(DIAGNOSTIC);
  if (m)
    raw.push({
      file: m[1],
      line: +m[2],
      column: +m[3],
      code: m[4],
      message: m[5],
    });
  else if (continues && CONTINUATION.test(line))
    raw[raw.length - 1].message += `\n${line}`;
  // A blank line ends the errors: `bun check` follows them with a summary.
  continues = m != null || (continues && line.trim() !== "");
}

const locators = new Map<string, ReturnType<typeof createLocator>>();
const locator = (key: string, text: string) => {
  let l = locators.get(key);
  if (!l) {
    l = createLocator(text);
    locators.set(key, l);
  }
  return l;
};
const diagnostics: Diagnostic[] = [];
const seen = new Set<string>();
let dropped = 0;
for (const d of raw) {
  const abs = resolve(ROOT, d.file);
  const gen = outputs.get(abs);
  let mapped: Diagnostic;
  if (gen) {
    const offset = locator(abs, gen.output.code).offset(d.line, d.column);
    const source = gen.output.toSource(offset);
    if (source === null) {
      dropped++;
      if (Bun.env.TYPECHECK_DEBUG)
        console.error(
          `dropped: ${d.file}(${d.line},${d.column}) ${d.code} ${d.message}`,
        );
      continue;
    }
    const { line, column } = locator(gen.svelte, gen.source).position(source);
    mapped = { ...d, file: relative(ROOT, gen.svelte), line, column };
  } else if (abs.startsWith(outDir)) {
    dropped++;
    continue;
  } else mapped = { ...d, file: relative(ROOT, abs) };
  const key = `${mapped.file}:${mapped.line}:${mapped.column}:${mapped.code}`;
  if (seen.has(key)) continue;
  seen.add(key);
  diagnostics.push(mapped);
}

diagnostics.sort(
  (a, b) =>
    a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
);
for (const d of diagnostics)
  console.log(
    values.output === "machine"
      ? `ERROR ${JSON.stringify(relative(workspace, resolve(ROOT, d.file)))} ${d.line}:${d.column} ${JSON.stringify(d.message)} ${d.code}`
      : `${d.file}:${d.line}:${d.column} - error ${d.code}: ${d.message}`,
  );
console.error(
  `${outputs.size} components, ${diagnostics.length} errors${dropped ? ` (${dropped} in generated code dropped)` : ""}${failed ? `, ${failed} failed to emit` : ""} [emit ${(emitted - started).toFixed(0)} ms, ${values.checker} ${(checked - emitted).toFixed(0)} ms]`,
);
process.exit(diagnostics.length || failed ? 1 : 0);
