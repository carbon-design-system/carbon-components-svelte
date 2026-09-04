/// <reference types="vitest/globals" />

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
            contentRect: { height: 100 } as DOMRectReadOnly,
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
