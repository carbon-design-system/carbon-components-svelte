import { posix } from "node:path";

/**
 * Static file-level dependency graph for picking the unit and e2e tests a
 * diff can affect. Zero dependencies: imports are read with regular
 * expressions, which is enough because every edge in this repo is spelled as
 * a string literal (static/dynamic imports, `vi.mock`, `import.meta.glob`,
 * fixture `<script src>`, `page.goto("/x.html")`).
 *
 * The graph must never miss an edge, so anything it can't read is treated as
 * "depends on everything" instead of being dropped:
 *
 * - an import that doesn't resolve, a non-literal `import()`/`require()`/
 *   `page.goto()`, or an unknown bare specifier;
 * - a file that reads the disk (`node:fs`, Bun's file APIs) without
 *   declaring what it reads in a `// @depends-on <glob> [glob…]` comment.
 *
 * Named imports from the package barrel resolve to the re-exported file, not
 * to every component. That relies on the package's own
 * `"sideEffects": ["css/*.css"]` contract: no module in `src/` does anything
 * at import time that another component could observe.
 */

export const BARREL = "src/index.js";

/** Every compiled `css/<entry>.css` is built from the whole `css/` tree. */
const BUILT_CSS = /^css\/[^/]+\.css$/;
const BUILT_CSS_DEPS = {
  files: ["scripts/build-css.ts"],
  patterns: ["css/**"],
};

const RESOLVE_SUFFIXES = [
  "",
  ".ts",
  ".js",
  ".svelte",
  "/index.ts",
  "/index.js",
];

export type FileDeps = {
  /** Repo-relative paths, plus `src/index.js#Name` for barrel names. */
  files: Set<string>;
  /** Root-relative globs, compiled. */
  patterns: RegExp[];
  /** Why this file's dependencies can't be known; non-empty = everything. */
  unknown: string[];
};

export type ParseContext = {
  /** Whether a repo-relative path is a source file in the graph. */
  exists: (path: string) => boolean;
  /** Whether a bare specifier names an installed package or a builtin. */
  isExternal: (specifier: string) => boolean;
  /** Barrel export name -> re-exported file. */
  barrel: Map<string, string>;
};

const GLOB_LITERAL = /[.+^$()|[\]\\]/g;
const AS = /\s+as\s+/;
const TYPE_PREFIX = /^type\s+/;
const QUERY = /[?#].*$/;
const PACKAGE_SUBPATH = /^carbon-components-svelte\/(.+)$/;
const COMMENTS = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
const NAMED_CLAUSE = /\{([^}]*)\}/;
const DEFAULT_OR_NAMESPACE = /^\s*[\w$*]/;
const URL_REF = /^[a-z]+:|^\/\//;
const STRING_LITERAL = /^["'`]([^"'`$]*)["'`]$/;
const QUOTED = /["']([^"']+)["']/g;
const LIST_SEPARATOR = /[\s,]+/;

const BARREL_EXPORT = /export\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
const STATIC_IMPORT =
  /(?:^|[\n;])\s*(?:import|export)\s+(?:type\s+)?([^;"'`]*?)\s*from\s*["']([^"'\n]+)["']/g;
const SIDE_EFFECT_IMPORT = /(?:^|[\n;])\s*import\s*["']([^"'\n]+)["']/g;
const CALL_WITH_LITERAL =
  /\b(?:import|require|vi\.(?:mock|doMock|unmock|importActual|importMock))\(\s*(["'`])([^"'`$\n]+)\1\s*[,)]/g;
const NON_LITERAL_CALL = /(?<![.\w])(?:import|require)\(\s*(?!["'`])[^)\s]/;
const GLOB_CALL =
  /\bimport\.meta\.glob(?:<[^>]*>)?\(\s*(\[[^\]]*\]|["'][^"']*["'])/g;
const GLOB_CALL_ANY = /\bimport\.meta\.glob(?:<[^>]*>)?\(/g;
const GOTO = /\.goto\(\s*([^,)]*)/g;
const HTML_REF = /<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+)["']/g;
const READS_DISK =
  /\b(?:from|import|require|importActual)\s*\(?\s*["'](?:node:)?(?:fs|fs\/promises|child_process)["']|\bBun\.(?:file|Glob|spawn)/;
const DEPENDS_ON =
  /^\s*(?:\/\/|\/?\*+)\s*@depends-on\s+(.+?)\s*(?:\*\/)?\s*$/gm;

/** Compiles a root-relative glob (`**`, `*`, `?`, `{a,b}`) to a RegExp. */
export function globToRegExp(glob: string): RegExp {
  let source = "";
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === "*" && glob[i + 1] === "*") {
      const slash = glob[i + 2] === "/";
      source += slash ? "(?:.*/)?" : ".*";
      i += slash ? 2 : 1;
    } else if (char === "*") source += "[^/]*";
    else if (char === "?") source += "[^/]";
    else if (char === "{") source += "(?:";
    else if (char === "}") source += ")";
    else if (char === ",") source += "|";
    else source += char.replace(GLOB_LITERAL, "\\$&");
  }
  return new RegExp(`^${source}$`);
}

/** Maps each name the barrel re-exports to the file it comes from. */
export function parseBarrel(source: string): Map<string, string> {
  const names = new Map<string, string>();
  const dir = posix.dirname(BARREL);
  for (const [, list, from] of source.matchAll(BARREL_EXPORT)) {
    const target = posix.join(dir, from);
    for (const part of list.replace(COMMENTS, "").split(",")) {
      const name = part.trim().split(AS).pop();
      if (name) names.set(name, target);
    }
  }
  return names;
}

/** Barrel names whose target differs between two versions of the barrel. */
export function changedBarrelNames(
  before: Map<string, string>,
  after: Map<string, string>,
): string[] {
  const names = new Set([...before.keys(), ...after.keys()]);
  return [...names].filter((name) => before.get(name) !== after.get(name));
}

/**
 * `null` for packages and builtins (covered by the lockfile), `undefined` for
 * specifiers that don't resolve.
 */
function resolvePath(from: string, specifier: string, context: ParseContext) {
  const bare = specifier.replace(QUERY, "");
  const subpath = bare.match(PACKAGE_SUBPATH)?.[1];
  let bases: string[];
  if (subpath?.startsWith("css/")) {
    bases = [subpath];
  } else if (subpath) {
    // Vite aliases the package name to `src/`; type tests resolve it through
    // `package.json` exports, where paths already start with `src/`.
    bases = [`src/${subpath}`, subpath];
  } else if (bare.startsWith(".")) {
    bases = [posix.join(posix.dirname(from), bare)];
  } else {
    return context.isExternal(bare) ? null : undefined;
  }
  for (const base of bases) {
    if (BUILT_CSS.test(base)) return base;
    for (const suffix of RESOLVE_SUFFIXES) {
      if (context.exists(base + suffix)) return base + suffix;
    }
  }
  return undefined;
}

/** Names in `{ … }`, or `undefined` for default/namespace imports. */
function barrelNames(clause: string): string[] | undefined {
  const named = clause.match(NAMED_CLAUSE);
  if (!named || DEFAULT_OR_NAMESPACE.test(clause.replace(NAMED_CLAUSE, ""))) {
    return undefined;
  }
  return named[1]
    .split(",")
    .map((part) => part.trim().replace(TYPE_PREFIX, "").split(AS)[0].trim())
    .filter(Boolean);
}

/** Reads one file's dependencies from its source text. */
export function parseDependencies(
  path: string,
  source: string,
  context: ParseContext,
): FileDeps {
  const deps: FileDeps = { files: new Set(), patterns: [], unknown: [] };
  const add = (specifier: string) => {
    const resolved = resolvePath(path, specifier, context);
    if (resolved === undefined) deps.unknown.push(`unresolved "${specifier}"`);
    else if (resolved !== null) deps.files.add(resolved);
  };

  if (BUILT_CSS.test(path)) {
    for (const file of BUILT_CSS_DEPS.files) deps.files.add(file);
    deps.patterns.push(...BUILT_CSS_DEPS.patterns.map(globToRegExp));
    return deps;
  }

  if (path.endsWith(".html")) {
    for (const [, ref] of source.matchAll(HTML_REF)) {
      if (!URL_REF.test(ref)) add(ref.startsWith(".") ? ref : `./${ref}`);
    }
  }

  for (const [, clause, specifier] of source.matchAll(STATIC_IMPORT)) {
    const names =
      specifier === "carbon-components-svelte"
        ? barrelNames(clause.replace(COMMENTS, ""))
        : null;
    if (names === null) add(specifier);
    else if (names === undefined) deps.files.add(BARREL);
    else {
      for (const name of names) {
        // Unknown names (types, typos) fall back to the whole barrel.
        deps.files.add(context.barrel.has(name) ? `${BARREL}#${name}` : BARREL);
      }
    }
  }
  for (const [, specifier] of source.matchAll(SIDE_EFFECT_IMPORT)) {
    add(specifier);
  }
  for (const [, , specifier] of source.matchAll(CALL_WITH_LITERAL)) {
    add(specifier);
  }
  if (NON_LITERAL_CALL.test(source)) {
    deps.unknown.push("non-literal dynamic import");
  }

  const globs = [...source.matchAll(GLOB_CALL)];
  if (globs.length !== [...source.matchAll(GLOB_CALL_ANY)].length) {
    deps.unknown.push("non-literal glob import");
  }
  for (const [, argument] of globs) {
    for (const [, glob] of argument.matchAll(QUOTED)) {
      // Negated patterns only narrow the match.
      if (glob.startsWith("!")) continue;
      const pattern = posix.join(posix.dirname(path), glob.replace(QUERY, ""));
      deps.patterns.push(globToRegExp(pattern));
    }
  }

  if (path.startsWith("e2e/")) {
    for (const [, argument] of source.matchAll(GOTO)) {
      const url = argument.trim().match(STRING_LITERAL)?.[1];
      if (url === undefined) {
        deps.unknown.push(`non-literal goto(${argument.trim()})`);
      } else if (url.startsWith("/")) {
        const page = `e2e/fixtures${url.replace(QUERY, "")}`;
        if (context.exists(page)) deps.files.add(page);
        else deps.unknown.push(`missing fixture "${url}"`);
      } else if (url !== "about:blank") {
        deps.unknown.push(`goto("${url}")`);
      }
    }
  }

  const declared = [...source.matchAll(DEPENDS_ON)].flatMap(([, list]) =>
    list.split(LIST_SEPARATOR).filter(Boolean),
  );
  for (const glob of declared) deps.patterns.push(globToRegExp(glob));
  if (READS_DISK.test(source) && declared.length === 0) {
    deps.unknown.push("reads the disk without @depends-on");
  }

  return deps;
}

export type Graph = Map<string, FileDeps>;

const PARSED = /\.(?:svelte|[cm]?[jt]s|html)$/;

/** Parses every source file; non-code files become leaves. */
export function buildGraph(
  sources: Map<string, string>,
  context: ParseContext,
): Graph {
  const graph: Graph = new Map();
  const leaf = (): FileDeps => ({
    files: new Set(),
    patterns: [],
    unknown: [],
  });
  for (const [path, source] of sources) {
    graph.set(
      path,
      PARSED.test(path) ? parseDependencies(path, source, context) : leaf(),
    );
  }
  for (const [name, target] of context.barrel) {
    graph.set(`${BARREL}#${name}`, { ...leaf(), files: new Set([target]) });
  }
  for (const deps of [...graph.values()]) {
    for (const file of deps.files) {
      if (BUILT_CSS.test(file) && !graph.has(file)) {
        graph.set(file, parseDependencies(file, "", context));
      }
    }
  }
  return graph;
}

type ReverseIndex = {
  dependents: Map<string, string[]>;
  globbers: [string, RegExp[]][];
  unknown: string[];
};

const indexes = new WeakMap<Graph, ReverseIndex>();

function reverseIndex(graph: Graph): ReverseIndex {
  const cached = indexes.get(graph);
  if (cached) return cached;
  const index: ReverseIndex = {
    dependents: new Map(),
    globbers: [],
    unknown: [],
  };
  for (const [path, deps] of graph) {
    for (const file of deps.files) {
      const list = index.dependents.get(file);
      list ? list.push(path) : index.dependents.set(file, [path]);
    }
    if (deps.patterns.length > 0) index.globbers.push([path, deps.patterns]);
    if (deps.unknown.length > 0) index.unknown.push(path);
  }
  indexes.set(graph, index);
  return index;
}

/**
 * Every node that transitively depends on one of `changed` (inclusive).
 * Files with unknown dependencies count as depending on any change unless
 * `includeUnknown` is false.
 */
export function affectedBy(
  graph: Graph,
  changed: Iterable<string>,
  { includeUnknown = true } = {},
) {
  const { dependents, globbers, unknown } = reverseIndex(graph);
  const affected = new Set<string>();
  const queue: string[] = [];
  const visit = (path: string) => {
    if (affected.has(path)) return;
    affected.add(path);
    queue.push(path);
  };

  for (const path of changed) visit(path);
  if (includeUnknown && affected.size > 0) unknown.forEach(visit);
  while (queue.length > 0) {
    const path = queue.pop() as string;
    for (const dependent of dependents.get(path) ?? []) visit(dependent);
    for (const [globber, patterns] of globbers) {
      if (!affected.has(globber) && patterns.some((re) => re.test(path))) {
        visit(globber);
      }
    }
  }
  return affected;
}

export type Selection =
  | { mode: "all" }
  | { mode: "none" }
  | { mode: "some"; files: string[] };

export type TestPlan = {
  unit: Selection;
  e2e: Selection;
  /** Why a suite falls back to a full run. */
  reasons: string[];
};

const UNIT_TEST = /^tests\/.+\.(?:test|spec)\.[cm]?[jt]sx?$/;
const E2E_TEST = /^e2e\/.+\.(?:test|spec)\.[cm]?[jt]sx?$/;

/** Files no test can observe. */
const IGNORED = [
  "**/*.md",
  "docs/**",
  "examples/**",
  "bench/**",
  "thumbnails/**",
  "ostia.config.ts",
  "biome.json",
  "carbon.yml",
  "telemetry.yml",
  "LICENSE",
  ".gitignore",
  ".github/FUNDING.yml",
].map(globToRegExp);

/** Roots the graph reads; any other changed file runs everything. */
const GRAPH_ROOTS = ["src/", "tests/", "e2e/", "css/", "scripts/"];

const COMPAT_HARNESS = /^tests-svelte[34]\//;

/** Changes to the selector itself can't be trusted to select themselves. */
const SELECTOR = ["scripts/test-changed.ts", "scripts/lib/test-graph.ts"];

/** Directories whose files only matter if some test reaches them. */
const SUITE_ROOTS = { unit: "tests/", e2e: "e2e/" } as const;

/** `all`, `none`, or the space-separated files, as CI step outputs. */
export function formatSelection(selection: Selection): string {
  return selection.mode === "some" ? selection.files.join(" ") : selection.mode;
}

function select(affected: Set<string>, tests: string[]): Selection {
  const files = tests.filter((file) => affected.has(file));
  if (files.length === 0) return { mode: "none" };
  if (files.length === tests.length) return { mode: "all" };
  return { mode: "some", files };
}

/**
 * Picks the unit and e2e test files `changed` can affect. `graph` is the head
 * revision; `changedBarrelNames` lists barrel names whose target moved.
 */
export function planTests(
  graph: Graph,
  changed: string[],
  barrelNamesChanged: string[] = [],
): TestPlan {
  const reasons: string[] = [];
  const full = { unit: false, e2e: false };
  const relevant: string[] = [];

  for (const file of changed) {
    if (IGNORED.some((re) => re.test(file))) continue;
    if (SELECTOR.includes(file)) {
      reasons.push(`${file}: test selector changed`);
      full.unit = full.e2e = true;
    } else if (COMPAT_HARNESS.test(file)) {
      reasons.push(`${file}: Svelte 3/4 harness changed`);
      full.unit = true;
    } else if (GRAPH_ROOTS.some((root) => file.startsWith(root))) {
      relevant.push(file);
    } else {
      reasons.push(`${file}: outside the dependency graph`);
      full.unit = full.e2e = true;
    }
  }

  const seeds = [
    ...relevant,
    ...barrelNamesChanged.map((n) => `${BARREL}#${n}`),
  ];
  const affected = affectedBy(graph, seeds);
  const nodes = [...graph.keys()];
  const tests = {
    unit: nodes.filter((file) => UNIT_TEST.test(file)),
    e2e: nodes.filter((file) => E2E_TEST.test(file)),
  };

  // A changed setup/config/helper file that no test imports is wired in some
  // other way (setupFiles, webServer, …): run its whole suite.
  for (const suite of ["unit", "e2e"] as const) {
    for (const file of relevant) {
      if (!file.startsWith(SUITE_ROOTS[suite])) continue;
      const reach = affectedBy(graph, [file], { includeUnknown: false });
      if (!tests[suite].some((test) => reach.has(test))) {
        const deleted = !graph.has(file);
        if (deleted && (suite === "unit" ? UNIT_TEST : E2E_TEST).test(file)) {
          continue;
        }
        reasons.push(`${file}: no ${suite} test imports it`);
        full[suite] = true;
      }
    }
  }

  return {
    unit: full.unit ? { mode: "all" } : select(affected, tests.unit),
    e2e: full.e2e ? { mode: "all" } : select(affected, tests.e2e),
    reasons,
  };
}
