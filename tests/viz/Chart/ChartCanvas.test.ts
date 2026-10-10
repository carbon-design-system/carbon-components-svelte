import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ChartCanvas from "./ChartCanvas.test.svelte";

// jsdom has no 2D context: record what a painter asks for instead.
const recorder = vi.hoisted(() => ({
  arcs: 0,
  fills: 0,
  strokes: 0,
  styles: [] as string[],
  clears: 0,
}));

const context = {
  setTransform: vi.fn(),
  clearRect: vi.fn(() => {
    recorder.clears += 1;
  }),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  arc: vi.fn(() => {
    recorder.arcs += 1;
  }),
  fill: vi.fn(() => {
    recorder.fills += 1;
    recorder.styles.push(String(context.fillStyle));
  }),
  stroke: vi.fn(() => {
    recorder.strokes += 1;
  }),
  fillStyle: "",
  strokeStyle: "",
  lineWidth: 0,
  globalAlpha: 1,
};

const frame = () => new Promise((resolve) => setTimeout(resolve, 40));
const canvas = () =>
  document.querySelector<HTMLCanvasElement>(".bx--viz-chart__canvas");
const dots = () => document.querySelectorAll(".bx--viz-points__point");

beforeEach(() => {
  recorder.arcs = 0;
  recorder.fills = 0;
  recorder.strokes = 0;
  recorder.styles = [];
  recorder.clears = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    () => context as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(
    () => "data:image/png;base64,AAAA",
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChartPoints on the canvas", () => {
  it("mounts one canvas behind the SVG and paints every point, one path per series", async () => {
    render(ChartCanvas);
    await frame();

    const layer = canvas();
    expect(layer).not.toBeNull();
    expect(layer?.getAttribute("aria-hidden")).toBe("true");
    const svg = screen.getByRole("application", { name: "Painted" });
    expect(
      layer &&
        layer.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(recorder.arcs).toBe(12);
    // Two series: two fills and two strokes, not twelve.
    expect(recorder.fills).toBe(2);
    expect(recorder.strokes).toBe(2);
    expect(recorder.styles[0]).not.toBe(recorder.styles[1]);
    // No point elements until one is hovered.
    expect(dots()).toHaveLength(0);
  });

  it("draws only the hovered point as an element, fades the layer, and does not repaint on hover", async () => {
    const onhover = vi.fn();
    render(ChartCanvas, { onhover });
    await frame();
    const painted = recorder.arcs;

    screen.getByRole("application", { name: "Painted" }).focus();
    await user.keyboard("{ArrowRight}");
    await frame();
    expect(onhover).toHaveBeenCalled();
    expect(dots()).toHaveLength(1);
    expect(dots()[0]).toHaveClass("bx--viz-points__point--active");
    expect(canvas()).toHaveClass("bx--viz-chart__canvas--dimmed");
    expect(document.querySelector(".bx--viz-chart-tooltip")).not.toBeNull();
    expect(recorder.arcs).toBe(painted);

    await user.keyboard("{Escape}");
    expect(canvas()).not.toHaveClass("bx--viz-chart__canvas--dimmed");
  });

  it("repaints when the data changes and removes the canvas when no mark paints", async () => {
    const { rerender } = render(ChartCanvas);
    await frame();
    expect(recorder.arcs).toBe(12);

    await rerender({ count: 20 });
    await frame();
    expect(recorder.arcs).toBe(32);

    await rerender({ count: 20, renderer: "svg" });
    await frame();
    expect(canvas()).toBeNull();
    expect(dots()).toHaveLength(20);
  });

  it("picks the canvas automatically above the threshold", async () => {
    render(ChartCanvas, { renderer: "auto", count: 30, canvasThreshold: 20 });
    await frame();
    expect(canvas()).not.toBeNull();
    expect(dots()).toHaveLength(0);
  });

  it("stays on SVG below the threshold", async () => {
    render(ChartCanvas, { renderer: "auto", count: 12, canvasThreshold: 20 });
    await frame();
    expect(canvas()).toBeNull();
    expect(dots()).toHaveLength(12);
  });
});
