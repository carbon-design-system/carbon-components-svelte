import { get } from "svelte/store";
import { createTableState } from "../../src/DataTable/table-state.js";

function setUrl(href: string) {
  window.history.replaceState(null, "", href);
}

describe("createTableState url", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setUrl("/");
  });

  afterEach(() => {
    vi.useRealTimers();
    setUrl("/");
  });

  it("gives the first subscriber the URL's state", () => {
    setUrl("/?sort=name:desc&page=3&pageSize=25&q=tcp");
    const table = createTableState({}, { url: true });

    expect(get(table)).toMatchObject({
      sortKey: "name",
      sortDirection: "descending",
      page: 3,
      pageSize: 25,
      search: "tcp",
    });
  });

  it("reads and writes only the prefixed parameters", () => {
    setUrl("/?q=other&t_q=tcp");
    const table = createTableState({}, { url: { prefix: "t_" } });
    const unsubscribe = table.subscribe(() => {});

    expect(get(table).search).toBe("tcp");
    table.patch({ search: "udp" });
    vi.advanceTimersByTime(20);

    expect(window.location.search).toBe("?q=other&t_q=udp");
    unsubscribe();
  });

  it("makes one replace per frame and leaves other parameters alone", () => {
    setUrl("/?tab=2");
    const replace = vi.fn();
    const table = createTableState({}, { url: { replace } });
    const unsubscribe = table.subscribe(() => {});

    for (const search of ["t", "tc", "tcp"]) table.patch({ search });
    expect(replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      `${window.location.origin}/?tab=2&q=tcp`,
    );
    unsubscribe();
  });

  it("leaves a parameter out when the state is back at its initial value", () => {
    const table = createTableState({}, { url: true });
    const unsubscribe = table.subscribe(() => {});

    table.patch({ search: "tcp" });
    vi.advanceTimersByTime(20);
    expect(window.location.search).toBe("?q=tcp");
    table.patch({ search: "" });
    vi.advanceTimersByTime(20);

    expect(window.location.search).toBe("");
    unsubscribe();
  });

  it("reads the URL again on back and forward navigation", () => {
    const table = createTableState({ pageSize: 25 }, { url: true });
    const unsubscribe = table.subscribe(() => {});

    setUrl("/?page=4&q=udp");
    window.dispatchEvent(new PopStateEvent("popstate"));

    expect(get(table)).toMatchObject({ page: 4, search: "udp", pageSize: 25 });
    vi.advanceTimersByTime(20);
    expect(window.location.search).toBe("?page=4&q=udp");
    unsubscribe();
  });

  it("stops listening and writes what is pending when the last subscriber leaves", () => {
    const table = createTableState({}, { url: true });
    const subscriber = vi.fn();
    const unsubscribe = table.subscribe(subscriber);

    table.patch({ search: "tcp" });
    unsubscribe();
    expect(window.location.search).toBe("?q=tcp");

    subscriber.mockClear();
    setUrl("/?q=udp");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe("createTableState persist", () => {
  const key = "table-state-test";

  beforeEach(() => {
    vi.useFakeTimers();
    setUrl("/");
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    setUrl("/");
  });

  it("keeps everything but the selection, search and page by default", () => {
    const table = createTableState({}, { persist: { key } });
    const unsubscribe = table.subscribe(() => {});

    table.patch({
      pageSize: 25,
      page: 2,
      search: "tcp",
      selectedRowIds: ["a"],
      sortKey: "name",
      sortDirection: "ascending",
    });

    expect(JSON.parse(window.localStorage.getItem(key) as string)).toEqual({
      sortKey: "name",
      sortDirection: "ascending",
      pageSize: 25,
    });
    unsubscribe();
  });

  it("restores the stored state for the first subscriber", () => {
    window.localStorage.setItem(key, JSON.stringify({ pageSize: 25 }));
    const table = createTableState({}, { persist: { key } });

    expect(get(table).pageSize).toBe(25);
  });

  it("uses sessionStorage for area session", () => {
    const table = createTableState(
      {},
      { persist: { key, area: "session", pick: ["pageSize"] } },
    );
    const unsubscribe = table.subscribe(() => {});

    table.patch({ pageSize: 25 });

    expect(window.sessionStorage.getItem(key)).toBe('{"pageSize":25}');
    expect(window.localStorage.getItem(key)).toBeNull();
    unsubscribe();
    window.sessionStorage.clear();
  });

  it.each([
    "not json",
    "[1]",
    "null",
    '{"pageSize":"many","sortKey":4,"search":"leak"}',
  ])("ignores the stored value %s", (stored) => {
    window.localStorage.setItem(key, stored);
    const table = createTableState({}, { persist: { key } });

    expect(get(table)).toMatchObject({
      pageSize: 10,
      sortKey: null,
      search: "",
    });
  });

  it("keeps working when storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const table = createTableState({}, { persist: { key } });
    const unsubscribe = table.subscribe(() => {});

    expect(() => table.patch({ pageSize: 25 })).not.toThrow();
    expect(get(table).pageSize).toBe(25);
    unsubscribe();
  });

  it("lets the URL win over storage, and storage over the initial state", () => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        pageSize: 25,
        sortKey: "name",
        sortDirection: "ascending",
      }),
    );
    setUrl("/?pageSize=50");
    const table = createTableState(
      { pageSize: 10 },
      { url: true, persist: { key } },
    );

    expect(get(table)).toMatchObject({
      pageSize: 50,
      sortKey: "name",
      sortDirection: "ascending",
    });
  });
});
