// @vitest-environment node
import { get } from "svelte/store";
import { createIdMembershipStore } from "../../src/utils/id-membership-store.js";

describe("createIdMembershipStore", () => {
  it("reports membership synchronously and through select()", () => {
    const store = createIdMembershipStore<number>([1, 2]);
    expect(store.has(1)).toBe(true);
    expect(store.has(3)).toBe(false);
    expect(get(store.select(2))).toBe(true);
    expect(get(store.select(3))).toBe(false);
  });

  it("notifies only ids whose membership changed", () => {
    const store = createIdMembershipStore<string>(["a", "b"]);
    const calls: string[] = [];
    for (const id of ["a", "b", "c", "d"]) {
      store.select(id).subscribe((value) => calls.push(`${id}:${value}`));
    }
    calls.length = 0;

    store.set(["b", "c"]);

    expect(calls.sort()).toEqual(["a:false", "c:true"]);
  });

  it("diffs members when they are fewer than subscribers", () => {
    const store = createIdMembershipStore<number>([0]);
    const calls: string[] = [];
    for (let id = 0; id < 50; id++) {
      store.select(id).subscribe((value) => calls.push(`${id}:${value}`));
    }
    calls.length = 0;

    store.set([7]);

    expect(calls.sort()).toEqual(["0:false", "7:true"]);
  });

  it("copies the ids it is given", () => {
    const ids = new Set(["a"]);
    const store = createIdMembershipStore<string>();
    store.set(ids);
    ids.add("b");

    expect(store.has("b")).toBe(false);
    const calls: boolean[] = [];
    store.select("b").subscribe((value) => calls.push(value));
    store.set(ids);
    expect(calls).toEqual([false, true]);
  });

  it("stops notifying after unsubscribe, even for a shared callback", () => {
    const store = createIdMembershipStore<string>();
    const callback = vi.fn();
    const unsubscribeFirst = store.select("a").subscribe(callback);
    store.select("a").subscribe(callback);
    callback.mockClear();

    unsubscribeFirst();
    store.set(["a"]);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
