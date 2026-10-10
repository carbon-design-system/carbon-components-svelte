import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import DonutChart from "./DonutChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/DonutChart/donut-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/DonutChart/donut-geometry.js")
      >();
    return {
      ...actual,
      buildDonut: (...args: Parameters<typeof actual.buildDonut>) => {
        geometry.calls += 1;
        return actual.buildDonut(...args);
      },
    };
  },
);

const slices = () =>
  Array.from(
    document.querySelectorAll<SVGPathElement>(".bx--viz-donut__slice"),
  );
const items = () =>
  within(screen.getByTestId("donut"))
    .getAllByRole("listitem")
    .map((item) => item.textContent?.replace(/\s+/g, " ").trim());

beforeEach(() => {
  geometry.calls = 0;
});

describe("DonutChart", () => {
  it("captions the figure and lists every slice with its share, largest first", () => {
    render(DonutChart);

    const figure = screen.getByRole("figure");
    expect(figure).toBe(screen.getByTestId("donut"));
    expect(figure.querySelector("figcaption")).toHaveTextContent(
      "Sessions by device",
    );
    expect(items()).toEqual([
      "Desktop 52%",
      "Mobile 31%",
      "Tablet 11%",
      "TV 4%",
      "Watch 2%",
    ]);
    expect(slices()).toHaveLength(5);
    // The legend is the text alternative, so the ring is decorative.
    expect(document.querySelector(".bx--viz-donut__svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("folds the smallest slices and can write values", () => {
    render(DonutChart, { maxSlices: 3, valueType: "both" });

    expect(items()).toEqual([
      "Desktop 52 (52%)",
      "Mobile 31 (31%)",
      "Other 17 (17%)",
    ]);
  });

  it("fills the center from the slot, and follows the hovered slice without rebuilding", async () => {
    const onhover = vi.fn();
    render(DonutChart, { onhover });
    const built = geometry.calls;

    expect(screen.getByTestId("center")).toHaveTextContent("100");

    await user.hover(slices()[1]);
    expect(screen.getByTestId("center")).toHaveTextContent("Mobile");
    expect(screen.getByTestId("donut")).toHaveClass("bx--viz-donut--emphasis");
    expect(slices()[1]).toHaveClass("bx--viz-donut__slice--active");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "Mobile", value: 31 }),
    );
    expect(geometry.calls).toBe(built);
  });

  it("renders no buttons unless selectable", () => {
    render(DonutChart);

    expect(
      within(screen.getByTestId("donut")).queryAllByRole("button"),
    ).toEqual([]);
  });

  it("selects from the legend or the ring, and clears on a second press", async () => {
    const onselect = vi.fn();
    render(DonutChart, { selectable: true, onselect });

    const buttons = within(screen.getByTestId("donut")).getAllByRole("button");
    await user.click(buttons[2]);
    expect(buttons[2]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("Tablet");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      slice: { id: "Tablet", rows: [{ device: "Tablet", sessions: 11 }] },
    });

    await user.click(slices()[0]);
    expect(screen.getByTestId("selected")).toHaveTextContent("Desktop");

    await user.click(slices()[0]);
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });

  it("draws an empty track for no data", () => {
    render(DonutChart, { data: [] });

    expect(slices()).toEqual([]);
    expect(document.querySelector(".bx--viz-donut__track")).not.toBeNull();
  });
});
