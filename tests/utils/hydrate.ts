// @depends-on src/** tests/fixtures/hydrate/**
import path from "node:path";
import { pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";
import type { Component } from "svelte";
import {
  type BrokenRef,
  brokenRefs,
  type Diff,
  diffTrees,
  formControlStates,
  isIdChange,
  normalizeIds,
} from "./dom-diff";
import { buildFixtures } from "./hydrate-build";

export type FixtureSpec = {
  /** Path to a `.svelte` file (a test fixture or a `src` component). */
  fixture: string;
  props?: Record<string, unknown>;
};

export type HydrateOptions = {
  /** `innerWidth` / `innerHeight`, also used by `matchMedia`. */
  viewport?: { width: number; height: number };
};

export type HydrateResult = {
  fixture: string;
  svelteVersion: string;
  /**
   * No error or warning, every server element kept, no non-id drift, and
   * once settled no unresolved id reference or lost form value. It ignores
   * `settledDiff`, because `onMount` work may change the DOM on purpose:
   * assert that one separately.
   */
  ok: boolean;
  /** Svelte discarded and rebuilt some server elements, often silently. */
  recovered: boolean;
  serverRenderError?: string;
  hydrateError?: string;
  serverHtml: string;
  serverHead: string;
  /** After `hydrate()` and `flushSync()`. */
  hydratedHtml: string;
  /** After a `tick()` and a 30 ms macrotask, once `onMount` work settled. */
  settledHtml: string;
  serverWarnings: string[];
  /** `console.warn` during hydration (Svelte's hydration warnings). */
  warnings: string[];
  /** `console.error` during hydration, plus uncaught errors. */
  errors: string[];
  /** Server DOM vs hydrated DOM. */
  diff: Diff[];
  /** `diff` with random ids normalized: drift other than ids. */
  diffIgnoringIds: Diff[];
  /** Hydrated DOM vs settled DOM: changes made after mount. */
  settledDiff: Diff[];
  /** `diff` entries that only swap one random id for another. */
  idChanges: number;
  /**
   * Server elements still connected to the document after settling. An
   * element a component moved elsewhere (a portal) counts as preserved.
   */
  identity: {
    serverElements: number;
    preserved: number;
    pct: number;
    replaced: string[];
  };
  /** Id references that resolve nowhere in the document. */
  brokenRefs: {
    server: BrokenRef[];
    hydrated: BrokenRef[];
    settled: BrokenRef[];
  };
  /** Form controls whose settled live state differs from the server HTML. */
  formLoss: string[];
};

type ServerRuntime = Pick<typeof import("svelte/server"), "render">;
type ClientRuntime = Pick<
  typeof import("svelte"),
  "flushSync" | "hydrate" | "tick" | "unmount"
>;
type FixtureModule = { default: Component<Record<string, unknown>> };

type ServerRender = {
  html: string;
  head: string;
  warnings: string[];
  error?: string;
};

const ANSI_ESCAPE = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, "g");
const STYLE_DIRECTIVE = /%c/g;
const STACK_LINE = /^\s*at /;
const DOCS_LINK = /^https:\/\/svelte\.dev/;
const WHITESPACE = /\s+/g;
const MIN_WIDTH = /\(\s*(min|max)-width:\s*([\d.]+)(px|rem|em)\s*\)/g;
const FIRST_TAG = /<([a-z][a-z0-9-]*)/i;
const COMMENTS = /<!--[\s\S]*?-->/g;
const SETTLE_MS = 30;
const UPPERCASE_START = /^[A-Z]/;

/**
 * Joins `console` arguments into one string. Svelte styles its warnings with
 * `%c` directives, each followed by one CSS argument; those are dropped.
 */
function format([first, ...rest]: unknown[]) {
  const styles =
    typeof first === "string" ? (first.match(STYLE_DIRECTIVE) ?? []).length : 0;
  return [
    typeof first === "string" ? first.replace(STYLE_DIRECTIVE, "") : first,
    ...rest.slice(styles),
  ]
    .map((arg) => (arg instanceof Error ? arg.message : String(arg)))
    .join(" ");
}

/** One line per message, without Svelte's stack and docs link. */
function tidy(messages: string[]) {
  return messages.map((message) =>
    message
      .replace(ANSI_ESCAPE, "")
      .split("\n")
      .filter((line) => !STACK_LINE.test(line) && !DOCS_LINK.test(line))
      .join(" ")
      .replace(WHITESPACE, " ")
      .trim(),
  );
}

function errorSummary(error: unknown) {
  return String((error as Error)?.stack ?? error)
    .split("\n")
    .slice(0, 4)
    .join(" | ");
}

/** Runs `fn` with `console.warn` and `console.error` captured. */
function captureConsole<T>(fn: () => T) {
  const warn: string[] = [];
  const error: string[] = [];
  const original = { warn: console.warn, error: console.error };
  console.warn = (...args) => warn.push(format(args));
  console.error = (...args) => error.push(format(args));

  try {
    return { value: fn(), warn, error };
  } catch (thrown) {
    return { thrown, warn, error };
  } finally {
    console.warn = original.warn;
    console.error = original.error;
  }
}

function load<T>(file: string): Promise<T> {
  return import(pathToFileURL(file).href);
}

/** Node globals a jsdom window must not replace. */
const NODE_GLOBALS = new Set([
  "undefined",
  "NaN",
  "Infinity",
  "globalThis",
  "console",
  "process",
  "performance",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "queueMicrotask",
  "structuredClone",
  "fetch",
  "Request",
  "Response",
  "Headers",
  "URL",
  "URLSearchParams",
  "TextEncoder",
  "TextDecoder",
  "crypto",
]);

const WINDOW_GLOBALS = [
  "document",
  "getComputedStyle",
  "localStorage",
  "sessionStorage",
];

/**
 * Evaluates the `min-width` / `max-width` conditions of a media query
 * against `width`; anything else does not match.
 */
function matchesViewport(query: string, width: number) {
  const conditions = [...query.matchAll(MIN_WIDTH)];
  return (
    conditions.length > 0 &&
    conditions.every(([, bound, value, unit]) => {
      const px = Number(value) * (unit === "px" ? 1 : 16);
      return bound === "min" ? width >= px : width <= px;
    })
  );
}

/**
 * Installs a jsdom window as globals, with the stubs `setup-globals.ts` adds
 * for jsdom tests. `uninstall` restores the previous globals, so a later
 * server render in the same process sees no DOM again.
 */
function installDom(viewport: { width: number; height: number }) {
  const { window } = new JSDOM(
    "<!doctype html><html><head></head><body></body></html>",
    { url: "http://localhost/", pretendToBeVisual: true },
  );
  const win = window as unknown as Record<string, unknown> & typeof window;

  Object.assign(win, {
    innerWidth: viewport.width,
    innerHeight: viewport.height,
  });
  win.matchMedia = (query: string) =>
    ({
      matches: matchesViewport(query, viewport.width),
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
  win.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  win.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  win.Element.prototype.scrollIntoView = () => {};

  // jsdom reflects `open` but does not implement the `<dialog>` methods.
  const dialog = win.HTMLDialogElement.prototype;
  dialog.showModal = function () {
    this.setAttribute("open", "");
  };
  dialog.show = function () {
    this.setAttribute("open", "");
  };
  dialog.close = function () {
    if (this.hasAttribute("open")) {
      this.removeAttribute("open");
      this.dispatchEvent(new win.Event("close"));
    }
  };

  const target = globalThis as unknown as Record<string, unknown>;
  const saved = new Map<string, PropertyDescriptor | undefined>();
  const define = (key: string, value: unknown) => {
    saved.set(key, Object.getOwnPropertyDescriptor(target, key));
    Object.defineProperty(target, key, {
      value,
      configurable: true,
      writable: true,
    });
  };

  for (const key of Object.getOwnPropertyNames(win)) {
    if (NODE_GLOBALS.has(key)) continue;
    // DOM classes plus a few instance globals; skips `name`, `status`, ...
    if (UPPERCASE_START.test(key) || WINDOW_GLOBALS.includes(key)) {
      define(key, win[key]);
    }
  }
  define("window", win);
  define("navigator", win.navigator);
  define("matchMedia", win.matchMedia);
  define("requestAnimationFrame", win.requestAnimationFrame.bind(win));
  define("cancelAnimationFrame", win.cancelAnimationFrame.bind(win));

  const uninstall = () => {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(target, key, descriptor);
      else Reflect.deleteProperty(target, key);
    }
    window.close();
  };

  return { document: win.document, uninstall };
}

/**
 * Parents a fixture's first element needs to survive HTML parsing (a `<tr>`
 * inside a `<div>` is dropped). The innermost one is the hydration target.
 */
const PARENTS: Record<string, string[]> = {
  tr: ["table", "tbody"],
  td: ["table", "tbody", "tr"],
  th: ["table", "tbody", "tr"],
  tbody: ["table"],
  thead: ["table"],
  tfoot: ["table"],
  caption: ["table"],
  colgroup: ["table"],
  option: ["select"],
  optgroup: ["select"],
  li: ["ul"],
  dt: ["dl"],
  dd: ["dl"],
};

function mountPoint(document: Document, html: string) {
  const first =
    FIRST_TAG.exec(html.replace(COMMENTS, ""))?.[1]?.toLowerCase() ?? "";
  let element: Element = document.body.appendChild(
    document.createElement("div"),
  );
  for (const tag of PARENTS[first] ?? []) {
    element = element.appendChild(document.createElement(tag));
  }
  element.id = "app";
  return element;
}

function describeElement(element: Element) {
  const className = element.getAttribute("class")?.split(" ")[0];
  return `${element.tagName.toLowerCase()}${className ? `.${className}` : ""}`;
}

function emptyResult(fixture: string, svelteVersion: string): HydrateResult {
  return {
    fixture,
    svelteVersion,
    ok: false,
    recovered: false,
    serverHtml: "",
    serverHead: "",
    hydratedHtml: "",
    settledHtml: "",
    serverWarnings: [],
    warnings: [],
    errors: [],
    diff: [],
    diffIgnoringIds: [],
    settledDiff: [],
    idChanges: 0,
    identity: { serverElements: 0, preserved: 0, pct: 100, replaced: [] },
    brokenRefs: { server: [], hydrated: [], settled: [] },
    formLoss: [],
  };
}

function renderOnServer(
  runtime: ServerRuntime,
  mod: PromiseSettledResult<FixtureModule>,
  props: Record<string, unknown>,
): ServerRender {
  if (mod.status === "rejected") {
    return {
      html: "",
      head: "",
      warnings: [],
      error: errorSummary(mod.reason),
    };
  }

  // `render()` is lazy: reading `body` and `head` is what runs the component.
  const run = captureConsole(() => {
    const { body, head } = runtime.render(mod.value.default, { props });
    return { body, head };
  });

  return {
    html: run.value?.body ?? "",
    head: run.value?.head ?? "",
    warnings: tidy([...run.warn, ...run.error]),
    error: "thrown" in run ? errorSummary(run.thrown) : undefined,
  };
}

async function hydrateOnClient(
  runtime: ClientRuntime,
  document: Document,
  mod: FixtureModule,
  props: Record<string, unknown>,
  result: HydrateResult,
) {
  const { body } = document;
  body.replaceChildren();
  for (const attr of [...body.attributes]) body.removeAttribute(attr.name);

  const target = mountPoint(document, result.serverHtml);
  target.innerHTML = result.serverHtml;

  const serverElements = [...target.querySelectorAll("*")];
  const serverTree = target.cloneNode(true) as Element;
  const serverForm = formControlStates(target, "attribute");
  result.brokenRefs.server = brokenRefs(body);

  const uncaught: string[] = [];
  const onUncaught = (error: unknown) =>
    uncaught.push(`uncaught: ${(error as Error)?.message ?? error}`);
  process.on("uncaughtException", onUncaught);
  process.on("unhandledRejection", onUncaught);

  let instance: ReturnType<ClientRuntime["hydrate"]> | undefined;

  try {
    const run = captureConsole(() => {
      instance = runtime.hydrate(mod.default, { target, props });
      runtime.flushSync();
    });
    if ("thrown" in run) result.hydrateError = errorSummary(run.thrown);
    result.warnings = tidy(run.warn);
    result.errors = tidy(run.error);

    result.hydratedHtml = target.innerHTML;
    const hydratedTree = target.cloneNode(true) as Element;
    result.brokenRefs.hydrated = brokenRefs(body);

    await runtime.tick();
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    runtime.flushSync();

    result.settledHtml = target.innerHTML;
    result.settledDiff = diffTrees(hydratedTree, target);
    result.brokenRefs.settled = brokenRefs(body);

    const liveForm = formControlStates(target, "property");
    if (liveForm.length === serverForm.length) {
      for (const [i, { control, value }] of serverForm.entries()) {
        if (value !== liveForm[i].value) {
          result.formLoss.push(
            `${control}: server "${value}" -> live "${liveForm[i].value}"`,
          );
        }
      }
    } else {
      result.formLoss.push(
        `form control count ${serverForm.length} -> ${liveForm.length}`,
      );
    }

    // `isConnected`, not `target.contains()`: an element a portal moved to
    // `body` is still the server's node.
    const replaced = serverElements.filter((el) => !el.isConnected);
    const preserved = serverElements.length - replaced.length;
    result.identity = {
      serverElements: serverElements.length,
      preserved,
      pct: serverElements.length
        ? Math.round((1000 * preserved) / serverElements.length) / 10
        : 100,
      replaced: replaced.slice(0, 10).map(describeElement),
    };
    result.recovered = result.identity.pct < 100;

    result.diff = diffTrees(serverTree, hydratedTree);
    result.idChanges = result.diff.filter(isIdChange).length;
    result.diffIgnoringIds = diffTrees(
      normalizeIds(serverTree.cloneNode(true) as Element),
      normalizeIds(hydratedTree.cloneNode(true) as Element),
    );
  } finally {
    process.off("uncaughtException", onUncaught);
    process.off("unhandledRejection", onUncaught);
    result.errors.push(...uncaught);
    try {
      if (instance) runtime.unmount(instance);
    } catch {
      // A fixture that failed to hydrate may not unmount cleanly.
    }
  }

  result.ok =
    !result.hydrateError &&
    result.warnings.length === 0 &&
    result.errors.length === 0 &&
    result.identity.pct === 100 &&
    result.diffIgnoringIds.length === 0 &&
    result.brokenRefs.settled.length === 0 &&
    result.formLoss.length === 0;
}

/**
 * Server-renders each fixture, then hydrates that HTML in jsdom with the
 * client build and reports what changed. One Vite build covers every spec,
 * so call this once per test file (in `beforeAll`).
 *
 * All server renders run first, with no DOM globals. Then one jsdom window
 * is installed as globals and each fixture hydrates into a fresh `body`.
 * The globals are removed again before this resolves.
 */
export async function hydrateFixtures(
  specs: FixtureSpec[],
  options: HydrateOptions = {},
): Promise<HydrateResult[]> {
  const { viewport = { width: 1280, height: 800 } } = options;
  const fixtures = specs.map((spec) => path.resolve(spec.fixture));
  const build = await buildFixtures({ fixtures });
  const file = (dir: string, fixture: string) =>
    path.join(dir, `${build.entries.get(fixture)}.js`);

  try {
    const serverRuntime = await load<ServerRuntime>(
      path.join(build.serverDir, "runtime.js"),
    );
    const serverModules = await Promise.allSettled(
      fixtures.map((fixture) =>
        load<FixtureModule>(file(build.serverDir, fixture)),
      ),
    );
    const results = specs.map((spec, i) => {
      const server = renderOnServer(
        serverRuntime,
        serverModules[i],
        spec.props ?? {},
      );
      return {
        ...emptyResult(
          path.relative(process.cwd(), fixtures[i]),
          build.svelteVersion,
        ),
        serverHtml: server.html,
        serverHead: server.head,
        serverWarnings: server.warnings,
        serverRenderError: server.error,
      };
    });

    const dom = installDom(viewport);
    try {
      const clientRuntime = await load<ClientRuntime>(
        path.join(build.clientDir, "runtime.js"),
      );
      const modules = await Promise.all(
        fixtures.map((fixture) =>
          load<FixtureModule>(file(build.clientDir, fixture)),
        ),
      );

      for (const [i, spec] of specs.entries()) {
        if (results[i].serverRenderError) continue;
        // biome-ignore lint/performance/noAwaitInLoops: fixtures share one document, so they hydrate one at a time.
        await hydrateOnClient(
          clientRuntime,
          dom.document,
          modules[i],
          spec.props ?? {},
          results[i],
        );
      }
    } finally {
      dom.uninstall();
    }

    return results;
  } finally {
    build.dispose();
  }
}

/** `hydrateFixtures` for a single fixture. */
export async function hydrateFixture(
  fixture: string,
  props: Record<string, unknown> = {},
  options: HydrateOptions = {},
) {
  const [result] = await hydrateFixtures([{ fixture, props }], options);
  return result;
}
