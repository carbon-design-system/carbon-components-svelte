import { get } from "svelte/store";
import {
  cookieTipStorage,
  createTipStore,
  localTipStorage,
  parseTipCookie,
  type TipStorage,
} from "../../src/utils/tip-store";

function memoryStorage(initial: string[] = []) {
  const storage = {
    ids: initial,
    read: vi.fn(() => storage.ids),
    write: vi.fn((ids: string[]) => {
      storage.ids = ids;
    }),
  };
  return storage;
}

describe("createTipStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("does not read the storage until it is connected", () => {
    const storage = memoryStorage(["a"]);
    const store = createTipStore({ storage });

    expect(storage.read).not.toHaveBeenCalled();
    expect(get(store)).toMatchObject({ ready: false, pending: "hide" });
    expect(store.isDismissed("a")).toBe(false);

    store.connect();

    expect(get(store).ready).toBe(true);
    expect(store.isDismissed("a")).toBe(true);
  });

  it("is ready from the start with the ids the server gave it", () => {
    const store = createTipStore({
      storage: memoryStorage(),
      initial: ["a"],
    });

    expect(get(store).ready).toBe(true);
    expect(store.isDismissed("a")).toBe(true);
  });

  it("adds the stored ids to the ones the server gave it", () => {
    const store = createTipStore({
      storage: memoryStorage(["b"]),
      initial: ["a"],
    });
    store.connect();

    expect([...get(store).dismissed].sort()).toEqual(["a", "b"]);
  });

  it("writes every dismissal, and the ids that stay after a reset", () => {
    const storage = memoryStorage();
    const store = createTipStore({ storage });
    store.connect();

    store.dismiss("a");
    store.dismiss(["b", "c"]);
    expect(storage.ids).toEqual(["a", "b", "c"]);

    store.reset("b");
    expect(storage.ids).toEqual(["a", "c"]);

    store.reset();
    expect(storage.ids).toEqual([]);
    expect(get(store).dismissed.size).toBe(0);
  });

  it("skips the write when the tip was dismissed already", () => {
    const storage = memoryStorage(["a"]);
    const store = createTipStore({ storage });
    store.connect();

    store.dismiss("a");

    expect(storage.write).not.toHaveBeenCalled();
  });

  it("takes in a change from another tab and stops listening on release", () => {
    let notify: (ids: string[]) => void = () => {};
    const stop = vi.fn();
    const storage: TipStorage = {
      read: () => [],
      write: () => {},
      subscribe(callback) {
        notify = callback;
        return stop;
      },
    };
    const store = createTipStore({ storage });
    const releaseA = store.connect();
    const releaseB = store.connect();

    notify(["a"]);
    expect(store.isDismissed("a")).toBe(true);
    notify([]);
    expect(store.isDismissed("a")).toBe(false);

    releaseA();
    releaseA();
    expect(stop).not.toHaveBeenCalled();
    releaseB();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  describe("an asynchronous storage", () => {
    function deferred() {
      let resolve: (ids: string[]) => void = () => {};
      const promise = new Promise<string[]>((done) => {
        resolve = done;
      });
      const storage: TipStorage = { read: () => promise, write: () => {} };
      return { storage, resolve };
    }

    it("stays pending until the read settles", async () => {
      const { storage, resolve } = deferred();
      const store = createTipStore({ storage });
      store.connect();
      expect(get(store).ready).toBe(false);

      resolve(["a"]);
      await vi.waitFor(() => expect(get(store).ready).toBe(true));
      expect(store.isDismissed("a")).toBe(true);
    });

    it("keeps a tip dismissed while the read ran", async () => {
      const { storage, resolve } = deferred();
      const store = createTipStore({ storage });
      store.connect();
      store.dismiss("b");

      resolve(["a"]);
      await vi.waitFor(() => expect(get(store).ready).toBe(true));
      expect([...get(store).dismissed].sort()).toEqual(["a", "b"]);
    });

    it("lets a reset made while the read ran win over it", async () => {
      const { storage, resolve } = deferred();
      const store = createTipStore({ storage });
      store.connect();
      store.reset();

      resolve(["a"]);
      await vi.waitFor(() => expect(get(store).ready).toBe(true));
      expect(store.isDismissed("a")).toBe(false);
    });

    it("treats a failed read as nothing dismissed and reports it", async () => {
      const onError = vi.fn();
      const store = createTipStore({
        storage: {
          read: () => Promise.reject(new Error("offline")),
          write() {},
        },
        onError,
      });
      store.connect();

      await vi.waitFor(() => expect(get(store).ready).toBe(true));
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it("keeps a dismissal for the session when the write fails", async () => {
    const onError = vi.fn();
    const store = createTipStore({
      storage: {
        read: () => [],
        write: () => Promise.reject(new Error("quota")),
      },
      onError,
    });
    store.connect();

    store.dismiss("a");

    expect(store.isDismissed("a")).toBe(true);
    await vi.waitFor(() => expect(onError).toHaveBeenCalled());
  });
});

describe("localTipStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads and writes a JSON array of ids", () => {
    const storage = localTipStorage("tips");
    storage.write(["a", "b"]);

    expect(localStorage.getItem("tips")).toBe('["a","b"]');
    expect(storage.read()).toEqual(["a", "b"]);
  });

  it.each([
    ["not json", []],
    ['{"a":1}', []],
    ['["a",1,null]', ["a"]],
  ])("reads the string ids out of %s", (raw, ids) => {
    localStorage.setItem("tips", raw as string);

    expect(localTipStorage("tips").read()).toEqual(ids);
  });

  it("updates a second store on the page that shares the key", () => {
    const first = createTipStore({ storage: localTipStorage("tips") });
    const second = createTipStore({ storage: localTipStorage("tips") });
    const releaseFirst = first.connect();
    const releaseSecond = second.connect();

    first.dismiss("a");
    expect(second.isDismissed("a")).toBe(true);

    second.reset();
    expect(first.isDismissed("a")).toBe(false);

    releaseFirst();
    releaseSecond();
  });

  it("ignores a store that uses another key", () => {
    const first = createTipStore({ storage: localTipStorage("one") });
    const second = createTipStore({ storage: localTipStorage("two") });
    const releaseFirst = first.connect();
    const releaseSecond = second.connect();

    first.dismiss("a");

    expect(second.isDismissed("a")).toBe(false);
    releaseFirst();
    releaseSecond();
  });
});

describe("cookieTipStorage", () => {
  afterEach(() => {
    document.cookie = "carbon-tips=; Max-Age=0; Path=/";
  });

  it("round-trips through the cookie the server reads", () => {
    const storage = cookieTipStorage();
    storage.write(["a", "b"]);

    expect(storage.read()).toEqual(["a", "b"]);
    expect(parseTipCookie(document.cookie)).toEqual(["a", "b"]);
  });
});

describe("parseTipCookie", () => {
  it("finds its cookie among others", () => {
    const value = encodeURIComponent(JSON.stringify(["a", "b"]));

    expect(parseTipCookie(`theme=g100; carbon-tips=${value}; lang=en`)).toEqual(
      ["a", "b"],
    );
  });

  it.each([undefined, null, "", "theme=g100", "carbon-tips=%E0%A4%A"])(
    "returns nothing for %s",
    (header) => {
      expect(parseTipCookie(header)).toEqual([]);
    },
  );
});
