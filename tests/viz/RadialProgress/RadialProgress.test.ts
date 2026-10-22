import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import RadialProgress from "./RadialProgress.test.svelte";

describe("RadialProgress", () => {
  it("is a named meter with the value and its text", () => {
    render(RadialProgress);

    const meter = screen.getByRole("meter", { name: "Disk usage" });
    expect(meter).toBe(screen.getByTestId("basic"));
    expect(meter).toHaveAttribute("aria-valuenow", "72");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAttribute("aria-valuetext", "72%");
    expect(meter.querySelector(".bx--viz-radial__value")).toHaveTextContent(
      "72%",
    );
  });

  it("is decorative without a label", () => {
    render(RadialProgress);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
  });

  it("draws a track, a fill, and a tick for each threshold", () => {
    render(RadialProgress);

    const root = screen.getByTestId("basic");
    expect(root.querySelector(".bx--viz-radial__track")).toHaveAttribute("d");
    expect(
      root.querySelector(".bx--viz-radial__fill")?.getAttribute("d"),
    ).toMatch(/^M/);
    expect(root.querySelectorAll(".bx--viz-radial__tick")).toHaveLength(2);
    expect(root.style.getPropertyValue("--bx-viz-color")).toBe("");
  });

  it("draws no fill at the start of the scale", () => {
    render(RadialProgress);

    expect(
      screen.getByTestId("empty").querySelector(".bx--viz-radial__fill"),
    ).toBeNull();
  });

  it("sizes a half arc to half the diameter and honors the scale", () => {
    render(RadialProgress);

    const root = screen.getByTestId("half");
    const svg = root.querySelector("svg");
    expect(svg).toHaveAttribute("viewBox", "0 0 120 60");
    expect(root).toHaveClass("bx--viz-radial--half");
    expect(root).toHaveAttribute("aria-valuetext", "30 GB");
    expect(root.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-success)",
    );
    expect(root.style.getPropertyValue("--bx-viz-diameter")).toBe("120px");
  });

  it("makes room below the center for a three quarter arc", () => {
    render(RadialProgress);

    const viewBox = screen
      .getByTestId("bare")
      .querySelector("svg")
      ?.getAttribute("viewBox")
      ?.split(" ")
      .map(Number);
    expect(viewBox?.[3]).toBeCloseTo(48 * (1 + Math.SQRT1_2));
  });

  it("hides the center, or fills it from the slot", () => {
    render(RadialProgress);

    expect(
      screen.getByTestId("bare").querySelector(".bx--viz-radial__center"),
    ).toBeNull();
    expect(
      screen.getByTestId("slotted").querySelector("strong"),
    ).toHaveTextContent("72% default");
  });

  it("takes the threshold color and fires threshold on a crossing, not on mount", async () => {
    const onthreshold = vi.fn();
    const { rerender } = render(RadialProgress, { props: { onthreshold } });
    await tick();
    expect(onthreshold).not.toHaveBeenCalled();

    await rerender({ value: 85, onthreshold });
    await tick();
    expect(
      screen.getByTestId("basic").style.getPropertyValue("--bx-viz-color"),
    ).toBe("var(--cds-viz-warning)");
    expect(onthreshold.mock.calls.map(([d]) => d)).toEqual([
      {
        threshold: { value: 80, kind: "warning" },
        direction: "above",
        value: 85,
      },
    ]);
  });
});
