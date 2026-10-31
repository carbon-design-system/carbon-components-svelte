/// <reference types="vitest/globals" />

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

// jsdom has no Web Animations API. Svelte 5 runs a `transition:` or `animate:`
// with a non-zero duration through `element.animate()` and `getAnimations()`,
// and throws without them. This `animate()` finishes on a timer, so an outro
// holds its element for the duration (fake timers drive it), and
// `getAnimations()` is empty. Svelte 3 and 4 use rAF and injected CSS instead.
if (typeof Element !== "undefined" && !Element.prototype.animate) {
  Element.prototype.animate = function animate(
    _keyframes: Keyframe[] | PropertyIndexedKeyframes | null,
    options?: number | KeyframeAnimationOptions,
  ) {
    const duration =
      typeof options === "number" ? options : Number(options?.duration ?? 0);
    const startedAt = performance.now();
    const animation = {
      effect: {} as AnimationEffect | null,
      playState: "running" as AnimationPlayState,
      onfinish: null as null | (() => void),
      get currentTime() {
        return performance.now() - startedAt;
      },
      cancel() {
        clearTimeout(timer);
        animation.playState = "idle";
      },
    };
    const timer = setTimeout(
      () => {
        animation.playState = "finished";
        animation.onfinish?.();
      },
      Math.max(duration, 0),
    );
    return animation as unknown as Animation;
  };
  Element.prototype.getAnimations = () => [];
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

// jsdom's selector engine adds its own capture listeners to `window` (click,
// keydown, focus, ...) the first time it matches a selector. Match once here
// so that happens before a test spies on `window.addEventListener`.
document.documentElement.matches(":focus-visible");

// Tooltips outside any `TooltipGroup` share one page-wide group, so a
// tooltip closed in one test would otherwise make the next test's first
// tooltip skip its enter delay.
beforeEach(() => {
  activeTooltip.set(null);
  rootTooltipGroup.scope.releasedAt = Number.NEGATIVE_INFINITY;
});
