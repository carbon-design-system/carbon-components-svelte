import { render } from "@testing-library/svelte";
import SessionStorageObject from "./SessionStorageObject.test.svelte";

describe("SessionStorage - Object Values", () => {
  let sessionStorageMock: { [key: string]: string };
  let originalSessionStorage: Storage;

  beforeEach(() => {
    originalSessionStorage = global.sessionStorage;
    sessionStorageMock = {};

    global.sessionStorage = {
      getItem: vi.fn((key) => sessionStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        sessionStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete sessionStorageMock[key];
      }),
      clear: vi.fn(() => {
        sessionStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    global.sessionStorage = originalSessionStorage;
    sessionStorage.clear();
    vi.restoreAllMocks();
    sessionStorageMock = {};
  });

  it("saves object value as JSON string", () => {
    render(SessionStorageObject);

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      "theme-settings",
      JSON.stringify({ theme: "dark", fontSize: 16 }),
    );
  });

  it("loads existing object value from sessionStorage", () => {
    const existingSettings = { theme: "light", fontSize: 14 };
    sessionStorageMock["theme-settings"] = JSON.stringify(existingSettings);

    render(SessionStorageObject);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("theme-settings");
  });

  it("handles malformed JSON gracefully", () => {
    sessionStorageMock["theme-settings"] = "{malformed-json}";

    render(SessionStorageObject);
    expect(sessionStorage.getItem).toHaveBeenCalledWith("theme-settings");
  });
});
