import { queueIdleMount } from "../../src/utils/idle-mount.js";

describe("queueIdleMount", () => {
  let idle: (() => void)[] = [];
  beforeEach(() => {
    idle = [];
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      idle.push(callback);
      return idle.length;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());
  });
  afterEach(() => vi.unstubAllGlobals());

  const at = (bottom: number) => {
    const element = document.createElement("div");
    element.getBoundingClientRect = () => ({ bottom }) as DOMRect;
    return element;
  };
  const runIdle = () => idle.shift()?.();

  it("mounts one at a time, in order, skipping what's above the viewport", () => {
    const mounted: string[] = [];
    queueIdleMount(at(100), () => mounted.push("first"));
    queueIdleMount(at(-10), () => mounted.push("above"));
    const unqueue = queueIdleMount(at(200), () => mounted.push("gone"));
    queueIdleMount(at(300), () => mounted.push("last"));
    unqueue();

    runIdle();
    expect(mounted).toEqual(["first"]);
    runIdle();
    expect(mounted).toEqual(["first", "last"]);
    expect(idle).toHaveLength(0);
  });
});
