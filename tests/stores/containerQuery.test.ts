import { get } from "svelte/store";
import { containerQuery } from "../../src/stores/containerQuery.js";

describe("containerQuery", () => {
  let trigger: (width: number) => void;
  let observe: ReturnType<typeof vi.fn>;
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observe = vi.fn();
    disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(
          cb: (entries: Array<{ contentRect: { width: number } }>) => void,
        ) {
          trigger = (width) => cb([{ contentRect: { width } }]);
        }
        observe = observe;
        disconnect = disconnect;
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("reports which named min-width ranges match the observed width", () => {
    const node = document.createElement("div");
    const store = containerQuery(node, { narrow: 0, medium: 400, wide: 800 });

    const unsubscribe = store.subscribe(() => {});
    expect(observe).toHaveBeenCalledWith(node);

    trigger(500);
    expect(get(store)).toEqual({ narrow: true, medium: true, wide: false });

    trigger(900);
    expect(get(store)).toEqual({ narrow: true, medium: true, wide: true });

    unsubscribe();
    expect(disconnect).toHaveBeenCalled();
  });

  test("reports all ranges false when ResizeObserver is unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const node = document.createElement("div");
    const store = containerQuery(node, { medium: 400 });

    const unsubscribe = store.subscribe(() => {});
    expect(get(store)).toEqual({ medium: false });
    unsubscribe();
  });
});
