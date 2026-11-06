import { queueIdleExample } from "../../docs/src/idle-examples";

const at = (bottom: number) => {
  const element = document.createElement("div");
  element.getBoundingClientRect = () => ({ bottom }) as DOMRect;
  return element;
};

describe("queueIdleExample", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("mounts queued examples in order when idle, except those above the viewport", () => {
    const mounted: string[] = [];
    queueIdleExample(at(100), () => mounted.push("first"));
    queueIdleExample(at(-10), () => mounted.push("above"));
    const unqueue = queueIdleExample(at(200), () => mounted.push("gone"));
    queueIdleExample(at(300), () => mounted.push("last"));
    unqueue();
    expect(mounted).toEqual([]);

    vi.runAllTimers();
    expect(mounted).toEqual(["first", "last"]);
  });
});
