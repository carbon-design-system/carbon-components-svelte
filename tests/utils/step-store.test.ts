import { get } from "svelte/store";
import { createStepStore } from "../../src/Stepper/step-store.js";

describe("createStepStore", () => {
  test("next() advances and returns true, false at the end", () => {
    const store = createStepStore({ ids: ["a", "b"], currentIndex: 0 });
    expect(store.next()).toBe(true);
    expect(get(store).currentIndex).toBe(1);
    expect(store.next()).toBe(false);
    expect(get(store).currentIndex).toBe(1);
  });

  test("back() advances backward and returns true, false at the start", () => {
    const store = createStepStore({ ids: ["a", "b"], currentIndex: 1 });
    expect(store.back()).toBe(true);
    expect(get(store).currentIndex).toBe(0);
    expect(store.back()).toBe(false);
    expect(get(store).currentIndex).toBe(0);
  });

  test("setIds re-anchors currentIndex to the surviving id", () => {
    const store = createStepStore({ ids: ["a", "b", "c"], currentIndex: 2 });
    store.setIds(["a", "c"]);
    expect(get(store).ids).toEqual(["a", "c"]);
    expect(get(store).currentIndex).toBe(1);
  });

  test("subscribe notifies once per change and not for no-op setters", () => {
    const store = createStepStore({ ids: ["a", "b"], currentIndex: 0 });
    const spy = vi.fn();
    const unsubscribe = store.subscribe(spy);
    spy.mockClear();

    store.next();
    expect(spy).toHaveBeenCalledTimes(1);

    store.goTo(1);
    expect(spy).toHaveBeenCalledTimes(1);

    store.setComplete("a", false);
    expect(spy).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  test("reset() restores the initial ids and index", () => {
    const store = createStepStore({ ids: ["a", "b"], currentIndex: 0 });
    store.next();
    store.setIds(["a", "b", "c"]);
    store.reset();
    expect(get(store)).toEqual(
      expect.objectContaining({ ids: ["a", "b"], currentIndex: 0 }),
    );
  });

  test("flags() reflects setComplete/setInvalid", () => {
    const store = createStepStore({ ids: ["a", "b"], currentIndex: 0 });
    store.setComplete("a");
    store.setInvalid("b");
    expect(store.flags("a").complete).toBe(true);
    expect(store.flags("b").invalid).toBe(true);
  });
});
