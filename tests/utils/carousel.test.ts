import { initCarousel } from "../../src/utils/carousel.js";

function buildContainer(count: number) {
  const container = document.createElement("div");
  for (let i = 0; i < count; i++) {
    const view = document.createElement("div");
    view.textContent = `view-${i}`;
    container.appendChild(view);
  }
  document.body.appendChild(container);
  return container;
}

describe("initCarousel", () => {
  test("shows only the first view on init", () => {
    const container = buildContainer(3);
    initCarousel(container);

    const views = Array.from(container.children) as HTMLElement[];
    expect(views[0].hidden).toBe(false);
    expect(views[1].hidden).toBe(true);
    expect(views[2].hidden).toBe(true);
  });

  test("next/prev move the active index and toggle visibility", () => {
    const container = buildContainer(3);
    const carousel = initCarousel(container);
    const views = Array.from(container.children) as HTMLElement[];

    carousel.next();
    expect(carousel.getActiveItem()).toEqual({ index: 1, item: views[1] });
    expect(views[0].hidden).toBe(true);
    expect(views[1].hidden).toBe(false);

    carousel.prev();
    expect(carousel.getActiveItem()).toEqual({ index: 0, item: views[0] });
    expect(views[0].hidden).toBe(false);
  });

  test("clamps at the ends instead of wrapping", () => {
    const container = buildContainer(2);
    const carousel = initCarousel(container);

    carousel.prev();
    expect(carousel.getActiveItem().index).toBe(0);

    carousel.next();
    carousel.next();
    expect(carousel.getActiveItem().index).toBe(1);
  });

  test("goToIndex clamps out-of-range targets", () => {
    const container = buildContainer(3);
    const carousel = initCarousel(container);

    carousel.goToIndex(10);
    expect(carousel.getActiveItem().index).toBe(2);

    carousel.goToIndex(-5);
    expect(carousel.getActiveItem().index).toBe(0);
  });

  test("reset returns to the first view", () => {
    const container = buildContainer(3);
    const carousel = initCarousel(container);

    carousel.goToIndex(2);
    carousel.reset();
    expect(carousel.getActiveItem().index).toBe(0);
  });

  test("fires onViewChangeStart/onViewChangeEnd only when the index actually changes", () => {
    const container = buildContainer(3);
    const onViewChangeStart = vi.fn();
    const onViewChangeEnd = vi.fn();
    const carousel = initCarousel(container, {
      onViewChangeStart,
      onViewChangeEnd,
    });

    carousel.goToIndex(0); // already active: no-op
    expect(onViewChangeStart).not.toHaveBeenCalled();

    carousel.next();
    expect(onViewChangeStart).toHaveBeenCalledTimes(1);
    expect(onViewChangeStart).toHaveBeenCalledWith({
      currentIndex: 1,
      previousIndex: 0,
      totalViews: 3,
    });
    expect(onViewChangeEnd).toHaveBeenCalledWith({
      currentIndex: 1,
      previousIndex: 0,
      totalViews: 3,
    });
  });

  test("rapid step-advance calls resolve to the final index synchronously", () => {
    const container = buildContainer(5);
    const carousel = initCarousel(container);

    carousel.next();
    carousel.next();
    carousel.next();

    expect(carousel.getActiveItem().index).toBe(3);
  });

  test("single view: next/prev are no-ops", () => {
    const container = buildContainer(1);
    const carousel = initCarousel(container);

    carousel.next();
    carousel.prev();
    expect(carousel.getActiveItem().index).toBe(0);
  });

  test("zero views: navigation and getActiveItem stay safe", () => {
    const container = buildContainer(0);
    const carousel = initCarousel(container);

    expect(carousel.getActiveItem()).toEqual({ index: -1, item: null });
    carousel.next();
    carousel.goToIndex(3);
    expect(carousel.getActiveItem()).toEqual({ index: -1, item: null });
  });

  test("destroyEvents unhides every view", () => {
    const container = buildContainer(3);
    const carousel = initCarousel(container);
    const views = Array.from(container.children) as HTMLElement[];

    carousel.next();
    carousel.destroyEvents();

    expect(views.every((view) => !view.hidden)).toBe(true);
  });
});
