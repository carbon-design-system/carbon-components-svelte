/// <reference types="vitest/globals" />

import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  activeTooltip,
  rootTooltipGroup,
} from "../../src/utils/tooltip-group.js";
import { rect } from "./rect";

Element.prototype.scrollIntoView = vi.fn();

// jsdom does not implement matchMedia. Default to "no match" so components that
// observe breakpoints (e.g. Tabs via breakpointObserver) render as desktop.
// Individual tests can `vi.stubGlobal("matchMedia", ...)` to simulate a size.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
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
            contentRect: rect({ height: 100 }),
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        this,
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

globalThis.ResizeObserver = ResizeObserverMock;

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

// jsdom's native `HTMLInputElement.files` setter enforces that the assigned
// value is a genuine jsdom-internal FileList, which our DataTransfer mock's
// `.files` (used to sync a drop container's input, e.g. FileUploaderDropContainer)
// can never satisfy. Fall back to a plain property override, matching what
// browsers actually let `input.files = dataTransfer.files` achieve.
{
  const nativeFilesDescriptor = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "files",
  );
  if (nativeFilesDescriptor?.set && nativeFilesDescriptor?.get) {
    Object.defineProperty(HTMLInputElement.prototype, "files", {
      get: nativeFilesDescriptor.get,
      configurable: true,
      set(value: FileList) {
        try {
          nativeFilesDescriptor.set?.call(this, value);
        } catch {
          Object.defineProperty(this, "files", {
            value,
            writable: true,
            configurable: true,
          });
        }
      },
    });
  }
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

// Tooltips outside any `TooltipGroup` share one page-wide group, so a
// tooltip closed in one test would otherwise make the next test's first
// tooltip skip its enter delay.
beforeEach(() => {
  activeTooltip.set(null);
  rootTooltipGroup.scope.releasedAt = Number.NEGATIVE_INFINITY;
});

// Leak check: once a test's components are cleaned up, listeners the
// library added to the window, document, `<html>` or `<body>` during the
// test, and MutationObservers it left on a node still in the page, should
// be gone; a test that leaves any fails. Vitest runs `afterEach` hooks last
// registered first, so this runs after testing-library's cleanup. A test
// that calls a util directly undoes what it attached itself. Only the
// library's `src/` counts: the docs site's code keeps page-long observers
// on purpose.
// (`new URL(…, import.meta.url)` would be rewritten by Vite as an asset.)
const LIBRARY = `${path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src")}/`;
const leaks = (
  globalThis as {
    __domEnv?: {
      leaks: {
        enabled(): boolean;
        mark(): number;
        since(mark: number, include: string): { what: string; at: string }[];
      };
    };
  }
).__domEnv?.leaks;
if (leaks?.enabled()) {
  let mark = 0;
  beforeEach(() => {
    mark = leaks.mark();
  });
  afterEach(() => {
    const found = leaks.since(mark, LIBRARY);
    if (found.length === 0) return;
    const list = found.map(({ what, at }) => `  ${what} at ${at}`).join("\n");
    throw new Error(`Left registered after cleanup:\n${list}`);
  });
}
