import { render } from "@testing-library/svelte";
import LocalStoragePrimitive from "./LocalStoragePrimitive.test.svelte";

describe("LocalStorage - Primitive Values", () => {
  let localStorageMock: { [key: string]: string };
  let originalLocalStorage: Storage;
  let consoleSpy: any;

  beforeEach(() => {
    originalLocalStorage = global.localStorage;
    localStorageMock = {};
    consoleSpy = vi.spyOn(console, "log");

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

  it("saves primitive value to localStorage on mount", () => {
    render(LocalStoragePrimitive);

    expect(localStorage.setItem).toHaveBeenCalledWith("test-key", "test-value");
  });

  it("loads existing primitive value from localStorage", () => {
    localStorageMock["test-key"] = "existing-value";

    render(LocalStoragePrimitive);
    expect(localStorage.getItem).toHaveBeenCalledWith("test-key");
  });

  it("dispatches save event when setting initial value", () => {
    render(LocalStoragePrimitive);
    expect(consoleSpy).toHaveBeenCalledWith("save event");
  });

  it("handles invalid values gracefully", () => {
    localStorageMock["test-key"] = "{invalid-value}";

    render(LocalStoragePrimitive);
    expect(localStorage.getItem).toHaveBeenCalledWith("test-key");
  });
});
