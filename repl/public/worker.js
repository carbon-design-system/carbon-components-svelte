// Compiler worker (classic, so the UMD compiler can load via importScripts).
// Compiles user files, rewrites imports against the artifact manifest, and
// posts runnable modules straight to the preview iframe over a MessagePort.

const params = new URLSearchParams(self.location.search);
const SVELTE = params.get("svelte");
const CCS = params.get("ccs");
const PKG_ORIGIN = params.get("pkg");

// Start manifest + icon index fetches before the (blocking) compiler load.
const manifestReady = fetch(
  `${PKG_ORIGIN}/pkg/ccs@${CCS}/svelte@${SVELTE}/manifest.json`,
)
  .then((r) => r.json())
  .then(async (manifest) => {
    const icons = await fetch(`${PKG_ORIGIN}${manifest.iconsIndex}`).then((r) =>
      r.json(),
    );
    return { manifest, icons: new Set(icons.names) };
  });

const compilerStarted = performance.now();
importScripts(`/compiler/svelte@${SVELTE}.js`);
const compilerMs = performance.now() - compilerStarted;
const { compile, compileModule, VERSION } = self.svelte;

/** @type {MessagePort | undefined} */
let runPort;
let pending;
let scheduled = false;
const cache = new Map();

self.onmessage = (event) => {
  const message = event.data;
  if (message.type === "init") {
    runPort = event.ports[0];
    self.postMessage({ type: "worker-ready", compilerMs, version: VERSION });
  } else if (message.type === "compile") {
    // Coalesce: only the latest request in the queue is compiled.
    pending = message;
    if (!scheduled) {
      scheduled = true;
      setTimeout(flush, 0);
    }
  }
};

async function flush() {
  scheduled = false;
  const job = pending;
  pending = undefined;
  if (!job) return;
  const { manifest, icons } = await manifestReady;
  const started = performance.now();
  const result = build(job, manifest, icons);
  const ms = performance.now() - started;
  if (result.ok) {
    runPort.postMessage({
      type: "run",
      seq: job.seq,
      entry: job.entry,
      modules: result.modules,
      preload: result.preload,
    });
  }
  self.postMessage({
    type: "compiled",
    seq: job.seq,
    ms,
    ok: result.ok,
    diagnostics: result.diagnostics,
  });
}

// ---------------------------------------------------------------------------

function compileFile(name, source) {
  const key = `${name}\0${source}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let out;
  if (name.endsWith(".svelte")) {
    const r = compile(source, {
      filename: name,
      generate: "client",
      dev: false,
      css: "injected",
    });
    out = { code: r.js.code, warnings: r.warnings };
  } else if (name.endsWith(".svelte.js")) {
    const r = compileModule(source, {
      filename: name,
      generate: "client",
      dev: false,
    });
    out = { code: r.js.code, warnings: r.warnings };
  } else if (name.endsWith(".js")) {
    out = { code: source, warnings: [] };
  } else if (name.endsWith(".json")) {
    JSON.parse(source);
    out = { code: `export default ${source};`, warnings: [] };
  } else {
    throw new Error(`Unsupported file type: ${name}`);
  }
  if (cache.size > 200) cache.delete(cache.keys().next().value);
  cache.set(key, out);
  return out;
}

const NAMESPACE_IMPORT = /^\*\s*as\s+([\w$]+)$/;
const BRACE_CLAUSE = /\{([^}]*)\}/;
const AS_SEPARATOR = /\s+as\s+/;
const ICON_DEEP_IMPORT = /^carbon-icons-svelte\/lib\/([\w]+)\.svelte$/;
const WS_OR_COMMENT = /\s+|\/\/[^\n]*|\/\*[\s\S]*?\*\//y;
const IMPORT = /import\s*(?:([^'"`;]*?)\s*from\s*)?(['"])([^'"\n]+)\2\s*;?/y;

/** Parses the leading import block (compiled output always hoists imports to the top). */
function leadingImports(code) {
  const imports = [];
  let i = 0;
  for (;;) {
    WS_OR_COMMENT.lastIndex = i;
    while (WS_OR_COMMENT.test(code)) {
      i = WS_OR_COMMENT.lastIndex;
      WS_OR_COMMENT.lastIndex = i;
    }
    IMPORT.lastIndex = i;
    const m = IMPORT.exec(code);
    if (!m) break;
    imports.push({
      start: i,
      end: IMPORT.lastIndex,
      clause: m[1]?.trim() ?? "",
      specifier: m[3],
    });
    i = IMPORT.lastIndex;
  }
  return imports;
}

/** `Default, { a, b as c }` / `* as ns` → { def, named: [[imported, local]], ns } */
function parseClause(clause) {
  const out = { def: undefined, named: [], ns: undefined };
  const brace = clause.match(BRACE_CLAUSE);
  if (brace) {
    for (const part of brace[1].split(",")) {
      const item = part.trim();
      if (!item) continue;
      const [imported, local] = item.split(AS_SEPARATOR);
      out.named.push([imported.trim(), (local ?? imported).trim()]);
    }
  }
  const rest = clause
    .replace(BRACE_CLAUSE, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const r of rest) {
    const ns = r.match(NAMESPACE_IMPORT);
    if (ns) out.ns = ns[1];
    else out.def = r;
  }
  return out;
}

function build(job, manifest, icons) {
  const diagnostics = [];
  const modules = [];
  const libraryPaths = new Set();
  const iconUrls = new Set();
  const names = new Set(job.files.map((f) => f.name));
  let ok = true;

  const error = (file, message, start) => {
    ok = false;
    diagnostics.push({
      file,
      severity: "error",
      message,
      line: start?.line,
      column: start?.column,
    });
  };

  for (const file of job.files) {
    let compiled;
    try {
      compiled = compileFile(file.name, file.source);
    } catch (e) {
      error(file.name, e.message, e.start);
      continue;
    }
    for (const w of compiled.warnings) {
      diagnostics.push({
        file: file.name,
        severity: "warning",
        message: w.message,
        code: w.code,
        line: w.start?.line,
        column: w.start?.column,
      });
    }

    const deps = [];
    let code = compiled.code;
    const imports = leadingImports(code);
    // Rewrite back-to-front so earlier offsets stay valid.
    for (let k = imports.length - 1; k >= 0; k--) {
      const imp = imports[k];
      let replacement;
      try {
        replacement = rewrite(imp, {
          manifest,
          icons,
          names,
          deps,
          libraryPaths,
          iconUrls,
        });
      } catch (e) {
        error(file.name, e.message);
        continue;
      }
      if (replacement !== undefined)
        code = code.slice(0, imp.start) + replacement + code.slice(imp.end);
    }
    modules.push({ name: file.name, code, deps });
  }

  if (!names.has(job.entry))
    error(job.entry, `Entry file ${job.entry} is missing`);

  return {
    ok,
    diagnostics,
    modules,
    preload: ok ? preloadUrls(manifest, libraryPaths, iconUrls) : [],
  };
}

function rewrite(imp, ctx) {
  const { manifest, icons, names, deps, libraryPaths, iconUrls } = ctx;
  const s = imp.specifier;

  if (s.startsWith("./")) {
    const name = s.slice(2);
    if (!names.has(name)) throw new Error(`Cannot find REPL file "${s}"`);
    deps.push(name);
    return imp.clause
      ? `import ${imp.clause} from "repl:${name}";`
      : `import "repl:${name}";`;
  }

  if (s.startsWith(".") || s.startsWith("/")) {
    throw new Error(
      `Only flat "./File" imports are supported between REPL files ("${s}")`,
    );
  }

  if (s === "svelte" || s.startsWith("svelte/")) {
    if (!manifest.runtime[s])
      throw new Error(`"${s}" is not available in the browser runtime`);
    return undefined;
  }

  if (s === "carbon-components-svelte") {
    const clause = parseClause(imp.clause);
    if (clause.ns || clause.def) {
      throw new Error(
        `Use named imports from "carbon-components-svelte" (e.g. import { Button } from …)`,
      );
    }
    const byPath = new Map();
    for (const [imported, local] of clause.named) {
      const entry = manifest.exports[imported];
      if (!entry)
        throw new Error(
          `"${imported}" is not exported by carbon-components-svelte`,
        );
      if (!byPath.has(entry.path)) byPath.set(entry.path, []);
      byPath.get(entry.path).push([entry.name, local]);
      libraryPaths.add(entry.path);
    }
    return [...byPath]
      .map(([path, items]) => {
        const def = items.find(([n]) => n === "default");
        const named = items
          .filter(([n]) => n !== "default")
          .map(([n, l]) => (n === l ? n : `${n} as ${l}`));
        const parts = [];
        if (def) parts.push(def[1]);
        if (named.length) parts.push(`{ ${named.join(", ")} }`);
        return `import ${parts.join(", ")} from "carbon-components-svelte/${path}";`;
      })
      .join("\n");
  }

  if (s.startsWith("carbon-components-svelte/")) {
    const path = s.slice("carbon-components-svelte/".length);
    if (!manifest.deps[path]) throw new Error(`"${s}" does not exist`);
    libraryPaths.add(path);
    return undefined;
  }

  if (s === "carbon-icons-svelte") {
    const clause = parseClause(imp.clause);
    if (clause.ns || clause.def)
      throw new Error(`Use named imports from "carbon-icons-svelte"`);
    return clause.named
      .map(([imported, local]) => {
        if (!icons.has(imported))
          throw new Error(
            `Icon "${imported}" does not exist in carbon-icons-svelte`,
          );
        iconUrls.add(`${manifest.iconsBase}/${imported}.svelte`);
        return `import ${local} from "carbon-icons-svelte/lib/${imported}.svelte";`;
      })
      .join("\n");
  }

  const iconDeep = s.match(ICON_DEEP_IMPORT);
  if (iconDeep) {
    if (!icons.has(iconDeep[1]))
      throw new Error(
        `Icon "${iconDeep[1]}" does not exist in carbon-icons-svelte`,
      );
    iconUrls.add(`${manifest.iconsBase}/${iconDeep[1]}.svelte`);
    return undefined;
  }

  throw new Error(
    `"${s}" is not available. Only svelte, carbon-components-svelte and carbon-icons-svelte can be imported.`,
  );
}

/** Full static closure of the imported library modules, as URLs on the sandbox origin. */
function preloadUrls(manifest, libraryPaths, iconUrls) {
  const urls = new Set();
  const seen = new Set();
  const stack = [...libraryPaths];
  while (stack.length) {
    const path = stack.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    urls.add(`${manifest.base}/${path}`);
    for (const dep of manifest.deps[path] ?? []) {
      if (manifest.deps[dep]) stack.push(dep);
      else if (manifest.vendor[dep]) urls.add(manifest.vendor[dep]);
    }
  }
  for (const u of iconUrls) urls.add(u);
  return [...urls];
}
