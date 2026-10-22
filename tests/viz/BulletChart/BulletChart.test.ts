import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import BulletChart from "./BulletChart.test.svelte";

const pct = (root: HTMLElement, part: string) =>
  root
    .querySelector<HTMLElement>(`.bx--viz-bullet__${part}`)
    ?.style.getPropertyValue("--bx-viz-pct");

describe("BulletChart", () => {
  it("names the image with the label, the value, and the target", () => {
    render(BulletChart);

    expect(screen.getByRole("img", { name: "Revenue: 270, target 300" })).toBe(
      screen.getByTestId("basic"),
    );
  });

  it("is decorative without a label", () => {
    render(BulletChart);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
    expect(root.querySelector(".bx--viz-bullet__target")).toBeNull();
    expect(root.querySelectorAll(".bx--viz-bullet__band")).toHaveLength(0);
  });

  it("positions the measure, the target, and the bands", () => {
    render(BulletChart);

    const root = screen.getByTestId("basic");
    expect(pct(root, "measure")).toBe("67.5");
    expect(pct(root, "target")).toBe("75");

    const bands = Array.from(
      root.querySelectorAll<HTMLElement>(".bx--viz-bullet__band"),
    );
    expect(bands.map((b) => b.style.getPropertyValue("--bx-viz-pct"))).toEqual([
      "37.5",
      "25",
      "37.5",
    ]);
    // Darkest first.
    expect(bands.map((b) => b.style.getPropertyValue("--bx-viz-step"))).toEqual(
      ["3", "2", "1"],
    );
  });

  it("writes a formatted value and localizes the accessible name", () => {
    render(BulletChart);

    const root = screen.getByTestId("formatted");
    expect(root).toHaveClass("bx--viz-bullet--sm");
    expect(root.querySelector(".bx--viz-bullet__value")).toHaveTextContent(
      /^270\s€$/,
    );
    expect(root.getAttribute("aria-label")).toMatch(
      /^Umsatz: 270\s€, Ziel 300\s€$/,
    );
  });

  it("resolves the color, and sets none by default", () => {
    render(BulletChart);

    const color = (id: string) =>
      screen.getByTestId(id).style.getPropertyValue("--bx-viz-color");
    expect(color("basic")).toBe("");
    expect(color("formatted")).toBe("var(--cds-viz-success)");
    expect(color("categorical")).toBe("var(--cds-viz-cat-03)");
  });

  it("fires threshold when an update crosses a band or the target, not on mount", async () => {
    const onthreshold = vi.fn();
    const { rerender } = render(BulletChart, { props: { onthreshold } });
    await tick();
    expect(onthreshold).not.toHaveBeenCalled();

    await rerender({ value: 320, onthreshold });
    await tick();
    expect(onthreshold.mock.calls.map(([detail]) => detail)).toEqual([
      { threshold: 300, kind: "target", direction: "above", value: 320 },
    ]);

    onthreshold.mockClear();
    await rerender({ value: 100, onthreshold });
    await tick();
    expect(onthreshold.mock.calls.map(([detail]) => detail)).toEqual([
      { threshold: 300, kind: "target", direction: "below", value: 100 },
      { threshold: 250, kind: "band", direction: "below", value: 100 },
      { threshold: 150, kind: "band", direction: "below", value: 100 },
    ]);

    onthreshold.mockClear();
    await rerender({ value: 120, onthreshold });
    await tick();
    expect(onthreshold).not.toHaveBeenCalled();
  });
});
