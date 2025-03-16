import { render } from "@testing-library/svelte";
import LocalStorageObject from "./LocalStorageObject.test.svelte";

describe("LocalStorage - Object Values", () => {
  let localStorageMock: { [key: string]: string };
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

  it("saves object value as JSON string", () => {
    render(LocalStorageObject);

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "dark", fontSize: 16 }),
    );
  });

  it("loads existing object value from localStorage", () => {
    const existingSettings = { theme: "light", fontSize: 14 };
    localStorageMock["theme-settings"] = JSON.stringify(existingSettings);

    render(LocalStorageObject);
    expect(localStorage.getItem).toHaveBeenCalledWith("theme-settings");
  });

  it("handles malformed JSON gracefully", () => {
    localStorageMock["theme-settings"] = "{malformed-json}";

    render(LocalStorageObject);
    expect(localStorage.getItem).toHaveBeenCalledWith("theme-settings");
  });
});
