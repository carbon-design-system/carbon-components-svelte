import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import LollipopChart from "./LollipopChart.test.svelte";

const chart = () =>
  screen.getByRole("application", { name: "Net new accounts" });
const stems = () =>
  Array.from(
    document.querySelectorAll<SVGLineElement>(".bx--viz-lollipops__stem"),
  ).map((line) => ({
    x1: Number(line.getAttribute("x1")),
    y1: Number(line.getAttribute("y1")),
    x2: Number(line.getAttribute("x2")),
    y2: Number(line.getAttribute("y2")),
  }));
const heads = () =>
  Array.from(
    document.querySelectorAll<SVGCircleElement>(".bx--viz-lollipops__head"),
  ).map((head) => ({
    cx: Number(head.getAttribute("cx")),
    cy: Number(head.getAttribute("cy")),
  }));

describe("LollipopChart", () => {
  it("draws a stem from zero and a head at the value for each datum", () => {
    render(LollipopChart);

    expect(stems()).toHaveLength(4);
    const [jan, feb] = stems();
    // Stems are upright and share the zero line.
    expect(jan.x1).toBe(jan.x2);
    expect(jan.y1).toBeCloseTo(feb.y1);
    // Up for a positive value, down for a negative one.
    expect(jan.y2).toBeLessThan(jan.y1);
    expect(feb.y2).toBeGreaterThan(feb.y1);
    // The head sits on the end of its stem.
    expect(heads()[1]).toEqual({ cx: feb.x2, cy: feb.y2 });
  });

  it("puts series side by side inside a slot", () => {
    render(LollipopChart);

    const [a, , b] = stems();
    expect(b.x1).toBeGreaterThan(a.x1);
    expect(b.x1 - a.x1).toBeLessThan(200);
  });

  it("lies on its side when horizontal", () => {
    render(LollipopChart, { orientation: "horizontal" });

    const [jan, feb] = stems();
    expect(jan.y1).toBe(jan.y2);
    expect(jan.x2).toBeGreaterThan(jan.x1);
    expect(feb.x2).toBeLessThan(feb.x1);
  });

  it("moves slot to slot with the keyboard and selects", async () => {
    const onselect = vi.fn();
    render(LollipopChart, { onselect });

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(document.querySelector(".bx--viz-bars__band")).not.toBeNull();
    expect(
      document.querySelectorAll(".bx--viz-lollipops__pop--dimmed"),
    ).toHaveLength(2);
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      "Feb",
    );

    await user.keyboard("{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ series: "a", index: 1 }),
    );
  });
});
