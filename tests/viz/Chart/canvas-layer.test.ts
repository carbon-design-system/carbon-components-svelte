import { get } from "svelte/store";
import { createCanvasLayer } from "../../../src/viz/Chart/canvas-layer.js";

const frame = () => new Promise((resolve) => setTimeout(resolve, 40));

function mount() {
  const figure = document.createElement("figure");
  const canvas = document.createElement("canvas");
  figure.appendChild(canvas);
  document.body.appendChild(figure);
  const context = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
  };
  vi.spyOn(canvas, "getContext").mockImplementation(
    () => context as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(canvas, "toDataURL").mockImplementation(
    () => "data:image/png;base64,AAAA",
  );
  return { figure, canvas, context };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("createCanvasLayer", () => {
  it("counts painters, paints them once per frame in order, and resolves tokens through the figure", async () => {
    const layer = createCanvasLayer();
    const { figure, canvas, context } = mount();
    const order: string[] = [];
    const seen: string[] = [];
    layer.attach(canvas, figure);
    layer.resize(300, 100);
    const stop = layer.register({
      draw: (ctx, paint) => {
        order.push("a");
        seen.push(paint.resolve("rgb(1, 2, 3)"));
        expect(ctx).toBe(context);
        expect(paint.width).toBe(300);
      },
    });
    layer.register({ draw: () => order.push("b"), dimOnHover: true });
    expect(get(layer.count)).toBe(2);
    expect(get(layer.dimming)).toBe(true);
    layer.invalidate();
    layer.invalidate();
    await frame();
    expect(order).toEqual(["a", "b"]);
    expect(context.clearRect).toHaveBeenCalledTimes(1);
    expect(context.setTransform).toHaveBeenCalledTimes(1);
    expect(seen).toEqual(["rgb(1, 2, 3)"]);

    stop();
    expect(get(layer.count)).toBe(1);
    expect(get(layer.dimming)).toBe(true);
  });

  it("paints immediately for a snapshot and returns nothing without painters", async () => {
    const layer = createCanvasLayer();
    const { figure, canvas } = mount();
    layer.attach(canvas, figure);
    layer.resize(10, 10);
    expect(layer.snapshot()).toBeNull();
    const draw = vi.fn();
    layer.register({ draw });
    expect(layer.snapshot()).toMatch(/^data:image\/png/);
    expect(draw).toHaveBeenCalledTimes(1);
    await frame();
    // The frame that was pending was cancelled by the snapshot.
    expect(draw).toHaveBeenCalledTimes(1);
  });

  it("does nothing before a canvas is attached or after it is detached", async () => {
    const layer = createCanvasLayer();
    const draw = vi.fn();
    layer.register({ draw });
    layer.resize(10, 10);
    layer.invalidate();
    await frame();
    expect(draw).not.toHaveBeenCalled();
    const { figure, canvas } = mount();
    const detach = layer.attach(canvas, figure);
    await frame();
    expect(draw).toHaveBeenCalledTimes(1);
    detach();
    layer.invalidate();
    await frame();
    expect(draw).toHaveBeenCalledTimes(1);
  });
});
