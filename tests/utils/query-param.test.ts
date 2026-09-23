import { get } from "svelte/store";
import { queryParam } from "../../src/utils/query-param.js";

describe("queryParam", () => {
  beforeEach(() => {
    history.replaceState(null, "", "/");
  });

  test("reads the initial value from the URL", () => {
    history.replaceState(null, "", "/?tab=settings");
    expect(get(queryParam("tab", { defaultValue: "overview" }))).toBe(
      "settings",
    );
  });

  test("falls back to the default when the parameter is missing", () => {
    expect(get(queryParam("tab", { defaultValue: "overview" }))).toBe(
      "overview",
    );
  });

  test("coerces by the type of the default value", () => {
    history.replaceState(null, "", "/?page=3&open=true&bad=abc");
    expect(get(queryParam("page", { defaultValue: 1 }))).toBe(3);
    expect(get(queryParam("open", { defaultValue: false }))).toBe(true);
    expect(get(queryParam("bad", { defaultValue: 1 }))).toBe(1);
  });

  test("uses parse and falls back when it returns undefined", () => {
    history.replaceState(null, "", "/?tab=bogus");
    const store = queryParam("tab", {
      defaultValue: "overview",
      parse: (raw) => (raw === "settings" ? raw : undefined),
    });
    expect(get(store)).toBe("overview");
  });

  test("set writes the parameter and keeps other parameters", () => {
    history.replaceState(null, "", "/?q=a");
    const store = queryParam("tab", { defaultValue: "overview" });
    store.set("settings");
    expect(get(store)).toBe("settings");
    expect(location.search).toBe("?q=a&tab=settings");
  });

  test("setting the default value removes the parameter", () => {
    history.replaceState(null, "", "/?tab=settings");
    const store = queryParam("tab", { defaultValue: "overview" });
    store.set("overview");
    expect(location.search).toBe("");
  });

  test("replaces history instead of pushing", () => {
    const length = history.length;
    const store = queryParam("page", { defaultValue: 1 });
    store.set(2);
    store.update((page) => page + 1);
    expect(location.search).toBe("?page=3");
    expect(history.length).toBe(length);
  });

  test("uses a custom replace and serialize", () => {
    const replace = vi.fn();
    const store = queryParam("ids", {
      defaultValue: [] as string[],
      parse: (raw) => raw.split(","),
      serialize: (ids) => ids.join(","),
      replace,
    });
    store.set(["a", "b"]);
    expect(replace).toHaveBeenCalledWith(`${location.origin}/?ids=a%2Cb`);
  });

  test("skips replace when the URL is unchanged", () => {
    history.replaceState(null, "", "/?tab=settings");
    const replace = vi.fn();
    const store = queryParam("tab", { defaultValue: "overview", replace });
    store.set("settings");
    expect(replace).not.toHaveBeenCalled();
  });

  test("re-reads the URL on popstate while subscribed", () => {
    const store = queryParam("tab", { defaultValue: "overview" });
    const values: string[] = [];
    const unsubscribe = store.subscribe((value) => values.push(value));

    history.replaceState(null, "", "/?tab=activity");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(values).toEqual(["overview", "activity"]);

    unsubscribe();
    history.replaceState(null, "", "/?tab=settings");
    window.dispatchEvent(new PopStateEvent("popstate"));
    expect(values).toEqual(["overview", "activity"]);
  });
});
