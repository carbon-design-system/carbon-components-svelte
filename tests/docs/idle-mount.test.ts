import { queueIdleMount } from "../../docs/src/idle-mount";

const at = (bottom: number) => {
  const element = document.createElement("div");
  element.getBoundingClientRect = () => ({ bottom }) as DOMRect;
  return element;
};

describe("queueIdleMount", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("mounts queued examples in order when idle, except those above the viewport", () => {
    const mounted: string[] = [];
    queueIdleMount(at(100), () => mounted.push("first"));
    queueIdleMount(at(-10), () => mounted.push("above"));
    const unqueue = queueIdleMount(at(200), () => mounted.push("gone"));
    queueIdleMount(at(300), () => mounted.push("last"));
    unqueue();
    expect(mounted).toEqual([]);

    vi.runAllTimers();
    expect(mounted).toEqual(["first", "last"]);
  });
});
