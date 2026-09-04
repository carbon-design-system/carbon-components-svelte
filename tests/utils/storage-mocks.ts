/// <reference types="vitest/globals" />

export const setupLocalStorageMock = () => {
  let localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    localStorageMock = {};
    vi.stubGlobal("localStorage", {
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
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

export const setupSessionStorageMock = () => {
  let sessionStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    sessionStorageMock = {};
    vi.stubGlobal("sessionStorage", {
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
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorageMock = {};
  });

  return {
    setMockItem: (key: string, value: string) => {
      sessionStorageMock[key] = value;
    },
    getMockItem: (key: string) => sessionStorageMock[key],
  };
};

/**
 * Sets up sessionStorage mock and storage event listener
 * capture for cross-tab sync testing.
 */
export const setupSessionStorageEventMock = () => {
  let sessionStorageMock: Record<string, string> = {};
  let storageEventListeners: ((event: StorageEvent) => void)[] = [];

  beforeEach(() => {
    sessionStorageMock = {};
    storageEventListeners = [];

    vi.stubGlobal("sessionStorage", {
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
    });

    const originalAddEventListener = window.addEventListener;
    vi.spyOn(window, "addEventListener").mockImplementation(
      (type, listener, options) => {
        if (type === "storage") {
          storageEventListeners.push(listener as (event: StorageEvent) => void);
        } else {
          originalAddEventListener.call(window, type, listener, options);
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorageMock = {};
    storageEventListeners = [];
  });

  function dispatchStorageEvent(key: string, newValue: string | null) {
    const event = {
      key,
      newValue,
      oldValue: null,
      storageArea: null,
      url: "",
    } as StorageEvent;

    for (const listener of storageEventListeners) {
      listener(event);
    }
  }

  return {
    dispatchStorageEvent,
    setMockItem: (key: string, value: string) => {
      sessionStorageMock[key] = value;
    },
    getMockItem: (key: string) => sessionStorageMock[key],
  };
};

/**
 * Sets up localStorage mock and storage event listener
 * capture for cross-tab sync testing.
 */
export const setupStorageEventMock = () => {
  let localStorageMock: Record<string, string> = {};
  let storageEventListeners: ((event: StorageEvent) => void)[] = [];

  beforeEach(() => {
    localStorageMock = {};
    storageEventListeners = [];

    vi.stubGlobal("localStorage", {
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
    });

    const originalAddEventListener = window.addEventListener;
    vi.spyOn(window, "addEventListener").mockImplementation(
      (type, listener, options) => {
        if (type === "storage") {
          storageEventListeners.push(listener as (event: StorageEvent) => void);
        } else {
          originalAddEventListener.call(window, type, listener, options);
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorageMock = {};
    storageEventListeners = [];
  });

  function dispatchStorageEvent(key: string, newValue: string | null) {
    // jsdom doesn't accept mock localStorage as storageArea, so we create a plain object
    const event = {
      key,
      newValue,
      oldValue: null,
      storageArea: null,
      url: "",
    } as StorageEvent;

    for (const listener of storageEventListeners) {
      listener(event);
    }
  }

  return {
    dispatchStorageEvent,
    setMockItem: (key: string, value: string) => {
      localStorageMock[key] = value;
    },
    getMockItem: (key: string) => localStorageMock[key],
  };
};
