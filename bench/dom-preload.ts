/// <reference types="bun" />
// ostia `--preload` script for the component-tier (`bench/*.dom.bench.ts`)
// suites — see CONTRIBUTING.md. Runs before each suite file loads, in the
// same spawned subprocess, and does the two things vitest's jsdom
// environment + @sveltejs/vite-plugin-svelte used to do for these benches:
//
//   1. Installs jsdom globals (document, window, HTMLElement, ...) so
//      @testing-library/svelte can render into a real DOM.
//   2. Registers a Bun.plugin() loader for `.svelte` imports, since Bun has
//      no native understanding of Svelte SFCs. Handles `<script lang="ts">`
//      (used by bench/fixtures/*.svelte) via Bun's own transpiler — there's
//      no other preprocessing need in this codebase (no <style lang="...">,
//      no <script lang="ts"> under src/, confirmed by grep before writing
//      this).
import { JSDOM } from "jsdom";
import { compile, compileModule, preprocess } from "svelte/compiler";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});

// Bun already implements some web-platform globals (Event, URL, fetch, ...).
// Anything DOM-shaped must come from jsdom's realm instead, so `instanceof`
// checks (Svelte's client runtime, @testing-library/svelte) see a single
// consistent object graph — keep only the handful of runtime-critical Bun
// globals that must stay Bun's own.
const KEEP_BUN_GLOBAL = new Set([
  "process",
  "Bun",
  "require",
  "module",
  "exports",
  "__dirname",
  "__filename",
  "global",
  "globalThis",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "setImmediate",
  "clearImmediate",
  "queueMicrotask",
]);

for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (KEEP_BUN_GLOBAL.has(key)) continue;
  try {
    // biome-ignore lint/suspicious/noExplicitAny: bulk global copy
    (globalThis as any)[key] = (dom.window as any)[key];
  } catch {
    // A handful of jsdom window properties are getter-only on globalThis
    // (e.g. `self`) — skip rather than throw.
  }
}

globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;

// jsdom does not implement matchMedia. Default to "no match" so components
// that observe breakpoints (e.g. Tabs via breakpointObserver) render as
// desktop — mirrors tests/utils/setup-globals.ts (this is a standalone
// reimplementation since that file's `vi.fn()` calls need vitest globals
// this subprocess doesn't have).
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

class ResizeObserverMock {
  callback: ResizeObserverCallback;
  elements: Element[];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    this.elements = [];
  }

  observe(element: Element) {
    this.elements.push(element);
    // Defer like the real ResizeObserver so the first paint can use unmeasured state.
    queueMicrotask(() => {
      if (!this.elements.includes(element)) return;
      this.callback(
        [
          {
            target: element,
            contentRect: { height: 100 } as DOMRectReadOnly,
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        this as unknown as ResizeObserver,
      );
    });
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter((el) => el !== element);
  }

  disconnect() {
    this.elements = [];
  }
}

globalThis.ResizeObserver =
  ResizeObserverMock as unknown as typeof ResizeObserver;

if (typeof DataTransfer === "undefined") {
  class DataTransferMock {
    items: DataTransferItemList;
    files: FileList = [] as unknown as FileList;
    private fileList: File[] = [];

    constructor() {
      this.items = {
        add: (file: File) => {
          this.fileList.push(file);
          this.updateFiles();
          return null as unknown as DataTransferItem;
        },
        length: 0,
      } as unknown as DataTransferItemList;

      this.updateFiles();
    }

    private updateFiles() {
      const fileList = Object.create(Array.prototype);
      this.fileList.forEach((file, index) => {
        fileList[index] = file;
      });
      fileList.length = this.fileList.length;
      fileList.item = (index: number) => this.fileList[index] || null;

      fileList[Symbol.iterator] = function* () {
        for (let i = 0; i < this.length; i++) {
          yield this[i];
        }
      };

      this.files = fileList as FileList;
    }
  }

  globalThis.DataTransfer = DataTransferMock as unknown as typeof DataTransfer;
}

// jsdom reflects the `open` attribute but does not implement showModal()/show()/close().
// https://github.com/jsdom/jsdom/issues/3294
if (
  typeof HTMLDialogElement !== "undefined" &&
  !HTMLDialogElement.prototype.showModal
) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.show = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    if (this.hasAttribute("open")) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    }
  };
}

Element.prototype.scrollIntoView = () => {};

async function compileSvelteComponent(
  source: string,
  filename: string,
): Promise<string> {
  const preprocessed = await preprocess(
    source,
    {
      script: ({ content, attributes }) => {
        if (attributes.lang === "ts") {
          const transpiler = new Bun.Transpiler({ loader: "ts" });
          return { code: transpiler.transformSync(content) };
        }
      },
    },
    { filename },
  );
  const { js } = compile(preprocessed.code, { filename, generate: "client" });
  return js.code;
}

const SVELTE_COMPONENT_FILTER = /\.svelte$/;
const SVELTE_MODULE_FILTER = /\.svelte\.js$/;

Bun.plugin({
  name: "svelte-loader",
  setup(build) {
    build.onLoad({ filter: SVELTE_COMPONENT_FILTER }, async (args) => {
      const source = await Bun.file(args.path).text();
      const contents = await compileSvelteComponent(source, args.path);
      return { contents, loader: "js" };
    });

    // Svelte 5 "module" files (e.g. @testing-library/svelte-core's
    // props.svelte.js) contain runes but aren't components — the compiler
    // has a separate entry point (compileModule) for these, and TS-in-JS
    // isn't a concern here since nothing in the dependency graph ships a
    // `.svelte.ts` file.
    build.onLoad({ filter: SVELTE_MODULE_FILTER }, async (args) => {
      const source = await Bun.file(args.path).text();
      const { js } = compileModule(source, {
        filename: args.path,
        generate: "client",
      });
      return { contents: js.code, loader: "js" };
    });
  },
});
