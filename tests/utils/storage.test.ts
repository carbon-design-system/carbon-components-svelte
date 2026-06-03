import {
  parseStoredValue,
  safeBrowserStorage,
  serializeStoredValue,
} from "../../src/utils/storage.js";

describe("parseStoredValue", () => {
  test("parses valid JSON objects and arrays", () => {
    expect(parseStoredValue('{"a":1}')).toEqual({ a: 1 });
    expect(parseStoredValue("[1,2,3]")).toEqual([1, 2, 3]);
  });

  test("parses JSON primitives back to their type", () => {
    expect(parseStoredValue("5")).toBe(5);
    expect(parseStoredValue("true")).toBe(true);
    expect(parseStoredValue("null")).toBe(null);
  });

  test("returns the raw string when JSON.parse fails", () => {
    expect(parseStoredValue("hello")).toBe("hello");
    expect(parseStoredValue("{not json")).toBe("{not json");
    expect(parseStoredValue("")).toBe("");
  });
});

describe("serializeStoredValue", () => {
  test("JSON-stringifies objects and arrays", () => {
    expect(serializeStoredValue({ a: 1 })).toBe('{"a":1}');
    expect(serializeStoredValue([1, 2, 3])).toBe("[1,2,3]");
  });

  test("stringifies null (typeof null === 'object')", () => {
    expect(serializeStoredValue(null)).toBe("null");
  });

  test("coerces non-object primitives to string", () => {
    expect(serializeStoredValue(5)).toBe("5");
    expect(serializeStoredValue(true)).toBe("true");
    expect(serializeStoredValue("hello")).toBe("hello");
    expect(serializeStoredValue(undefined)).toBe("undefined");
  });
});

describe("parse/serialize round-trip", () => {
  test("parse(serialize(value)) equals value", () => {
    for (const value of [5, true, "raw string", { a: 1, b: [2] }, [1, 2]]) {
      expect(parseStoredValue(serializeStoredValue(value))).toEqual(value);
    }
  });
});

describe("safeBrowserStorage (working storage)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  test("getItem/setItem/removeItem/clear delegate to the real store", () => {
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

  test("targets sessionStorage when requested", () => {
    const storage = safeBrowserStorage("sessionStorage");
    expect(storage.setItem("s", "v")).toBe(true);
    expect(sessionStorage.getItem("s")).toBe("v");
    expect(localStorage.getItem("s")).toBe(null);
  });
});

describe("safeBrowserStorage (write throws)", () => {
  afterEach(() => vi.restoreAllMocks());

  test("setItem returns false when the underlying store throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const storage = safeBrowserStorage("localStorage");
    expect(storage.setItem("k", "v")).toBe(false);
  });
});

describe("safeBrowserStorage (no window)", () => {
  test("getItem and setItem do not throw when window is undefined", () => {
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", undefined);

    try {
      const storage = safeBrowserStorage("localStorage");
      expect(() => storage.getItem("k")).not.toThrow();
      expect(storage.getItem("k")).toBe(null);
      expect(() => storage.setItem("k", "v")).not.toThrow();
      expect(storage.setItem("k", "v")).toBe(false);
    } finally {
      vi.stubGlobal("window", originalWindow);
    }
  });
});

describe("safeBrowserStorage (storage blocked)", () => {
  afterEach(() => vi.restoreAllMocks());

  test("returns null and false when window.localStorage getter throws", () => {
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

  test("getItem returns null when the store's getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("read failed");
    });
    const storage = safeBrowserStorage("localStorage");
    expect(storage.getItem("k")).toBe(null);
  });
});
