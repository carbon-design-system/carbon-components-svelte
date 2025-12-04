/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { userEvent } from "@testing-library/user-event";

// Dynamically load Svelte version - each test directory resolves to its own svelte/package.json
// This import will resolve to the correct version based on which node_modules is used
// Using dynamic import() to ensure it loads from the correct location at runtime
const sveltePkg = await import("svelte/package.json");

export const SVELTE_VERSION = Number.parseInt(
  sveltePkg.version.split(".")[0],
  10,
);
export const isSvelte3 = SVELTE_VERSION === 3;
export const isSvelte4 = SVELTE_VERSION === 4;
export const isSvelte5 = SVELTE_VERSION === 5;

Element.prototype.scrollIntoView = vi.fn();

class ResizeObserverMock {
  callback: ResizeObserverCallback;
  elements: Element[];

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    this.elements = [];
  }

  observe(element: Element) {
    this.elements.push(element);
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
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter((el) => el !== element);
  }

  disconnect() {
    this.elements = [];
  }
}

global.ResizeObserver = ResizeObserverMock;

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

  global.DataTransfer = DataTransferMock as unknown as typeof DataTransfer;
}

export const user = userEvent.setup();

export const setupLocalStorageMock = () => {
  let localStorageMock: { [key: string]: string } = {};
  let originalLocalStorage: Storage;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    localStorage.clear();
    vi.restoreAllMocks();
    localStorageMock = {};
  });

  return {
    setMockItem: (key: string, value: string) => {
      localStorageMock[key] = value;
    },
    getMockItem: (key: string) => localStorageMock[key],
  };
};
