import { observeMove } from "../../src/utils/observe-move.js";
import {
  type IntersectionObserverMock,
  stubIntersectionObserver,
} from "./intersection-observer-mock";
import { rect } from "./rect";

describe("observeMove", () => {
  let instances: IntersectionObserverMock[];
  let element: HTMLElement;
  let box: DOMRect;

  /** Delivers an entry showing `ratio` of the element to the latest observer. */
  const deliver = (ratio: number) => {
    const observer = instances.at(-1);
    assert(observer);
    observer.callback(
      [
        {
          target: element,
          intersectionRatio: ratio,
        } as unknown as IntersectionObserverEntry,
      ],
      observer as unknown as IntersectionObserver,
    );
  };

  beforeEach(() => {
    ({ instances } = stubIntersectionObserver());
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      1000,
    );
    vi.spyOn(document.documentElement, "clientHeight", "get").mockReturnValue(
      800,
    );
    element = document.createElement("div");
    box = rect({ top: 100, left: 20, width: 200, height: 40 });
    element.getBoundingClientRect = () => box;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shrinks the root to the element's box", () => {
    observeMove(element, () => {});

    expect(instances).toHaveLength(1);
    expect(instances[0].options).toEqual({
      rootMargin: "-100px -780px -660px -20px",
      threshold: 1,
    });
    expect(instances[0].elements).toEqual(new Set([element]));
  });

  it("reports a move and watches the new position", () => {
    const onMove = vi.fn();
    observeMove(element, onMove);
    deliver(1);
    expect(onMove).not.toHaveBeenCalled();

    box = rect({ top: 180, left: 20, width: 200, height: 40 });
    deliver(0.5);

    expect(onMove).toHaveBeenCalledOnce();
    expect(instances).toHaveLength(2);
    expect(instances[0].elements.size).toBe(0);
    expect(instances[1].options?.rootMargin).toBe("-180px -780px -580px -20px");
  });

  it("watches a clipped element for a change from the share that shows", () => {
    observeMove(element, () => {});
    deliver(0.25);

    expect(instances).toHaveLength(2);
    expect(instances[1].options?.threshold).toBe(0.25);
  });

  it("stops watching", () => {
    const stop = observeMove(element, () => {});
    stop();

    expect(instances[0].elements.size).toBe(0);
  });
});
