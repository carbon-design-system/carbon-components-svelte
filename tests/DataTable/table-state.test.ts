import { get } from "svelte/store";
import type { TableState } from "../../src/DataTable/table-state.js";
import {
  createTableState,
  tableStateFromSearchParams,
  tableStateToSearchParams,
} from "../../src/DataTable/table-state.js";

type WithFilters = TableState & { filters: { status: string } };
type WithStatus = TableState & { status: string[] };

describe("createTableState", () => {
  it("starts from complete defaults", () => {
    expect(get(createTableState())).toEqual({
      sortKey: null,
      sortDirection: "none",
      page: 1,
      pageSize: 10,
      search: "",
      selectedRowIds: [],
    });
  });

  it.each([
    ["search", { search: "tcp" }],
    ["pageSize", { pageSize: 25 }],
    ["sortKey", { sortKey: "name", sortDirection: "ascending" }],
    ["sortDirection", { sortKey: "name", sortDirection: "descending" }],
  ] as const)("resets page to 1 when %s changes", (_, change) => {
    const table = createTableState({ page: 4, sortKey: "name" });
    table.patch(change);
    expect(get(table).page).toBe(1);
  });

  it("keeps a page that the same write sets", () => {
    const table = createTableState();
    table.patch({ search: "tcp", page: 3 });
    expect(get(table)).toMatchObject({ search: "tcp", page: 3 });
  });

  it("resets page for a key in resetPageOn", () => {
    const table = createTableState<WithFilters>(
      { page: 4, filters: { status: "open" } },
      { resetPageOn: ["filters"] },
    );
    table.patch({ filters: { status: "closed" } });
    expect(get(table).page).toBe(1);
  });

  it("does not reset page when an unrelated key changes", () => {
    const table = createTableState({ page: 4 });
    table.patch({ selectedRowIds: ["a"] });
    expect(get(table).page).toBe(4);
  });

  it("wakes no subscriber for a write that changes nothing", () => {
    const table = createTableState({ search: "tcp" });
    const subscriber = vi.fn();
    table.subscribe(subscriber);

    table.patch({ search: "tcp" });
    table.set({ ...get(table) });
    table.update((state) => ({ ...state }));

    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it("diffs a bound write against its own copy", () => {
    const table = createTableState();
    let subscribed = get(table);
    const unsubscribe = table.subscribe((value) => {
      subscribed = value;
    });

    // What `bind:search={$table.search}` compiles to.
    subscribed.search = "tcp";
    table.set(subscribed);

    expect(get(table).search).toBe("tcp");
    unsubscribe();
  });

  it("is not changed by mutating a subscribed value without a set", () => {
    const table = createTableState();
    get(table).page = 9;
    (get(table).selectedRowIds as unknown[]).push("a");

    table.patch({ search: "tcp" });

    expect(get(table)).toMatchObject({ page: 1, selectedRowIds: [] });
  });

  it("gives every store its own selectedRowIds", () => {
    const first = createTableState();
    const second = createTableState();
    first.patch({ selectedRowIds: ["a"] });
    expect(get(second).selectedRowIds).toEqual([]);
  });

  it.each([undefined, null, {}, "x", { page: 0, pageSize: -1, sortKey: 4 }])(
    "normalizes set(%j) against the defaults",
    (value) => {
      const table = createTableState({ pageSize: 25 });
      table.patch({ page: 3, search: "tcp" });
      table.set(value as never);
      expect(get(table)).toEqual({
        sortKey: null,
        sortDirection: "none",
        page: 1,
        pageSize: 25,
        search: "",
        selectedRowIds: [],
      });
    },
  );

  it("limits pageSize to pageSizes", () => {
    const table = createTableState({}, { pageSizes: [10, 25] });
    table.patch({ pageSize: 99 });
    expect(get(table).pageSize).toBe(10);
    table.patch({ pageSize: 25 });
    expect(get(table).pageSize).toBe(25);
  });

  it("restores the initial state on reset", () => {
    const table = createTableState({ pageSize: 25 });
    table.patch({ search: "tcp", page: 3 });
    table.reset();
    expect(get(table)).toMatchObject({ pageSize: 25, search: "", page: 1 });
  });
});

describe("table state search params", () => {
  const defaults = { pageSize: 25 };

  it("round trips and leaves defaults out", () => {
    const state = createTableState(defaults);
    state.patch({
      sortKey: "name",
      sortDirection: "descending",
      page: 3,
      search: "load balancer",
    });

    const params = tableStateToSearchParams(get(state), { defaults });

    expect(params.toString()).toBe("sort=name%3Adesc&page=3&q=load+balancer");
    expect(tableStateFromSearchParams(params, { defaults })).toEqual(
      get(state),
    );
  });

  it("reads a sort key that holds a colon", () => {
    const state = tableStateFromSearchParams("sort=meta:size:asc");
    expect(state).toMatchObject({
      sortKey: "meta:size",
      sortDirection: "ascending",
    });
  });

  it.each(["page=2.5", "page=0", "page=-1", "page=1e3", "page=", "page=abc"])(
    "rejects %s",
    (query) => {
      expect(tableStateFromSearchParams(query).page).toBe(1);
    },
  );

  it("rejects a page size off the whitelist and above the cap", () => {
    const pageSizes = [10, 25];
    expect(
      tableStateFromSearchParams("pageSize=99", { pageSizes }).pageSize,
    ).toBe(10);
    expect(tableStateFromSearchParams("pageSize=100000").pageSize).toBe(10);
  });

  it("rejects a sort key off the whitelist", () => {
    const state = tableStateFromSearchParams("sort=password:asc", {
      sortKeys: ["name"],
    });
    expect(state).toMatchObject({ sortKey: null, sortDirection: "none" });
  });

  it("keeps unrelated parameters and applies a prefix", () => {
    const state = createTableState();
    state.patch({ search: "tcp" });

    const params = tableStateToSearchParams(get(state), {
      defaults: get(createTableState()),
      prefix: "t_",
      base: "tab=2&q=other",
    });

    expect(params.toString()).toBe("tab=2&q=other&t_q=tcp");
    expect(tableStateFromSearchParams(params, { prefix: "t_" }).search).toBe(
      "tcp",
    );
  });

  it("writes everything but empty values without defaults", () => {
    const params = tableStateToSearchParams(get(createTableState()));
    expect(params.toString()).toBe("page=1&pageSize=10");
  });

  it("reads and writes a key through a codec", () => {
    const codecs = {
      status: {
        parse: (raw: string) => raw.split(","),
        serialize: (value: string[]) => value.join(","),
      },
    };
    const table = createTableState<WithStatus>({ status: [] }, { codecs });
    table.patch({ status: ["open", "late"] });

    const params = tableStateToSearchParams(get(table), { codecs });

    expect(params.get("status")).toBe("open,late");
    expect(
      tableStateFromSearchParams<WithStatus>(params, { codecs }).status,
    ).toEqual(["open", "late"]);
  });
});

describe("createTableState settled", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("waits for typing to pause, and follows other changes at once", () => {
    vi.useFakeTimers();
    const table = createTableState({ pageSize: 5 });
    const seen: string[] = [];
    const stop = table.settled.subscribe((state) => {
      seen.push(`${state.search}|${state.sortKey}|${state.page}`);
    });

    table.patch({ page: 3 });
    table.patch({ search: "b" });
    table.patch({ search: "ba" });
    table.patch({ search: "ban" });
    vi.advanceTimersByTime(299);
    expect(seen).toEqual(["|null|1", "|null|3"]);

    vi.advanceTimersByTime(1);
    expect(seen).toEqual(["|null|1", "|null|3", "ban|null|1"]);

    // A sort while a search waits lands at once, with the search.
    table.patch({ search: "bana" });
    table.patch({ sortKey: "name", sortDirection: "ascending" });
    expect(seen.at(-1)).toBe("bana|name|1");
    vi.advanceTimersByTime(300);
    expect(seen).toHaveLength(4);
    stop();
  });

  it("follows every change at once with searchDebounce 0", () => {
    const table = createTableState({}, { searchDebounce: 0 });
    table.patch({ search: "x" });
    expect(get(table.settled).search).toBe("x");
  });
});
