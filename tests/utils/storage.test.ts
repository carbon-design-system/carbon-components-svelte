import {
  parseStoredValue,
  safeBrowserStorage,
  serializeStoredValue,
} from "../../src/utils/storage.js";

describe("parseStoredValue", () => {
  it.each([
    ['{"a":1}', { a: 1 }],
    ["[1,2,3]", [1, 2, 3]],
    ["5", 5],
    ["true", true],
    ["null", null],
  ])("parses %s back to its JSON value", (raw, expected) => {
    expect(parseStoredValue(raw)).toEqual(expected);
  });

  it("returns the raw string when JSON.parse fails", () => {
    expect(parseStoredValue("hello")).toBe("hello");
    expect(parseStoredValue("{not json")).toBe("{not json");
    expect(parseStoredValue("")).toBe("");
  });
});

describe("serializeStoredValue", () => {
  it("JSON-stringifies objects and arrays", () => {
    expect(serializeStoredValue({ a: 1 })).toBe('{"a":1}');
    expect(serializeStoredValue([1, 2, 3])).toBe("[1,2,3]");
  });

  it("coerces non-object primitives to string", () => {
    expect(serializeStoredValue(5)).toBe("5");
    expect(serializeStoredValue(true)).toBe("true");
    expect(serializeStoredValue("hello")).toBe("hello");
    expect(serializeStoredValue(undefined)).toBe("undefined");
  });
});

describe("safeBrowserStorage (working storage)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("getItem/setItem/removeItem/clear delegate to the real store", () => {
    const storage = safeBrowserStorage("localStorage");

    expect(storage.getItem("k")).toBe(null);
    expect(storage.setItem("k", "v")).toBe(true);
    expect(storage.getItem("k")).toBe("v");
    expect(localStorage.getItem("k")).toBe("v");

    storage.removeItem("k");
    expect(storage.getItem("k")).toBe(null);

    storage.setItem("a", "1");
    storage.clear();
    expect(localStorage.getItem("a")).toBe(null);
  });

  it("targets sessionStorage when requested", () => {
    const storage = safeBrowserStorage("sessionStorage");
    expect(storage.setItem("s", "v")).toBe(true);
    expect(sessionStorage.getItem("s")).toBe("v");
    expect(localStorage.getItem("s")).toBe(null);
  });
});

describe("safeBrowserStorage (write throws)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("setItem returns false when the underlying store throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const storage = safeBrowserStorage("localStorage");
    expect(storage.setItem("k", "v")).toBe(false);
  });
});

describe("safeBrowserStorage (storage blocked)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns null and false when window.localStorage getter throws", () => {
    const original = Object.getOwnPropertyDescriptor(window, "localStorage");
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage disabled");
      },
    });

    try {
      const storage = safeBrowserStorage("localStorage");
      expect(storage.getItem("k")).toBe(null);
      expect(storage.setItem("k", "v")).toBe(false);
      expect(() => storage.removeItem("k")).not.toThrow();
      expect(() => storage.clear()).not.toThrow();
    } finally {
      if (original) {
        Object.defineProperty(window, "localStorage", original);
      }
    }
  });

  it("getItem returns null when the store's getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("read failed");
    });
    const storage = safeBrowserStorage("localStorage");
    expect(storage.getItem("k")).toBe(null);
  });
});
