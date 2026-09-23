import {
  fit as fitBounds,
  identity,
  toScreen,
  toWorld,
  translate,
  viewport,
  zoomAt,
} from "../../src/utils/viewport.js";

describe("viewport math", () => {
  test("round-trips between world and screen", () => {
    const t = { k: 2, tx: 10, ty: -5 };
    const s = toScreen(t, 3, 4);
    expect(s).toEqual({ x: 16, y: 3 });
    expect(toWorld(t, s.x, s.y)).toEqual({ x: 3, y: 4 });
    expect(identity()).toEqual({ k: 1, tx: 0, ty: 0 });
  });

  test("zooms about a screen point, keeping the world point under it still, within limits", () => {
    const t = { k: 1, tx: 0, ty: 0 };
    const zoomed = zoomAt(t, 2, 100, 50);
    expect(zoomed.k).toBe(2);
    expect(toWorld(zoomed, 100, 50)).toEqual(toWorld(t, 100, 50));
    expect(zoomAt(t, 100, 0, 0, { max: 4 }).k).toBe(4);
    expect(zoomAt(t, 0.001, 0, 0, { min: 0.5 }).k).toBe(0.5);
    expect(translate(t, 5, -5)).toEqual({ k: 1, tx: 5, ty: -5 });
  });

  test("fits bounds centered with padding, never larger than max", () => {
    const t = fitBounds(
      { x0: 0, y0: 0, x1: 200, y1: 100 },
      { width: 640, height: 400 },
      { padding: 20 },
    );
    expect(t.k).toBe(1);
    expect(t).toEqual({ k: 1, tx: 220, ty: 150 });
    const small = fitBounds(
      { x0: 100, y0: 100, x1: 1100, y1: 600 },
      { width: 500, height: 300 },
      { padding: 0 },
    );
    expect(small.k).toBeCloseTo(0.5);
    expect(toScreen(small, 600, 350)).toEqual({ x: 250, y: 150 });
  });
});

describe("viewport action", () => {
  function setup() {
    const node = document.createElement("div");
    document.body.appendChild(node);
    node.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 400,
        height: 300,
        right: 400,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON() {},
      }) as DOMRect;
    let t = identity();
    const action = viewport(node, {
      get: () => t,
      set: (next) => (t = next),
      min: 0.5,
      max: 4,
    });
    return { node, action, read: () => t };
  }

  test("pans on a plain wheel and zooms about the pointer with Ctrl", () => {
    const { node, read } = setup();
    node.dispatchEvent(
      new WheelEvent("wheel", {
        deltaX: 10,
        deltaY: 20,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(read()).toEqual({ k: 1, tx: -10, ty: -20 });
    node.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: -100,
        ctrlKey: true,
        clientX: 200,
        clientY: 150,
        bubbles: true,
        cancelable: true,
      }),
    );
    expect(read().k).toBeCloseTo(Math.E);
    expect(toWorld(read(), 200, 150)).toEqual(
      toWorld({ k: 1, tx: -10, ty: -20 }, 200, 150),
    );
  });

  test("pans with a drag past the threshold and stops on destroy", async () => {
    const { node, action, read } = setup();
    const pointer = (type: string, x: number, y: number, button = 0) =>
      node.dispatchEvent(
        new MouseEvent(type, {
          clientX: x,
          clientY: y,
          button,
          bubbles: true,
          cancelable: true,
        }),
      );
    pointer("pointerdown", 10, 10);
    pointer("pointermove", 11, 10);
    await new Promise((r) => setTimeout(r, 30));
    expect(read().tx).toBe(0);
    pointer("pointermove", 30, 25);
    pointer("pointermove", 40, 25);
    await new Promise((r) => setTimeout(r, 30));
    expect(read()).toEqual({ k: 1, tx: 30, ty: 15 });
    pointer("pointerup", 40, 25);
    action.destroy();
    pointer("pointerdown", 10, 10);
    pointer("pointermove", 50, 50);
    await new Promise((r) => setTimeout(r, 30));
    expect(read().tx).toBe(30);
  });
});
