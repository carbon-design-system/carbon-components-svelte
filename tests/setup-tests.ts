/// <reference types="vitest/globals" />
import "@testing-library/jest-dom/vitest";
import { userEvent } from "@testing-library/user-event";

// Mock scrollIntoView since it's not implemented in JSDOM
Element.prototype.scrollIntoView = vi.fn();

// Mock ResizeObserver since it's not implemented in JSDOM
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
