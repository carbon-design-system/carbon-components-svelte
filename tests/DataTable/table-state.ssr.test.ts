// @vitest-environment node

import { get } from "svelte/store";
import {
  createTableState,
  tableStateFromSearchParams,
  tableStateToSearchParams,
} from "../../src/DataTable/table-state.js";

describe("createTableState on the server", () => {
  it("subscribes and writes with url and persist without a window", () => {
    expect(typeof window).toBe("undefined");
    const table = createTableState(
      { pageSize: 25 },
      { url: true, persist: { key: "tickets" } },
    );
    const unsubscribe = table.subscribe(() => {});

    expect(() => table.patch({ search: "tcp" })).not.toThrow();
    expect(get(table)).toMatchObject({ pageSize: 25, search: "tcp" });
    unsubscribe();
  });

  it("starts from the request's search params", () => {
    const url = new URL("https://example.com/tickets?sort=name:desc&page=2");
    const initial = tableStateFromSearchParams(url.searchParams);
    const table = createTableState(initial, { url: true });

    expect(tableStateToSearchParams(get(table)).toString()).toBe(
      "sort=name%3Adesc&page=2&pageSize=10",
    );
  });
});
