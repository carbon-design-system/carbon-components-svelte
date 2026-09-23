import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import HorizonChart from "./HorizonChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/HorizonChart/horizon-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/HorizonChart/horizon-geometry.js")
      >();
    return {
      ...actual,
      buildHorizon: (...args: Parameters<typeof actual.buildHorizon>) => {
        geometry.calls += 1;
        return actual.buildHorizon(...args);
      },
    };
  },
);

const chart = () => screen.getByRole("application", { name: "CPU by host" });
const rows = () =>
  Array.from(document.querySelectorAll(".bx--viz-horizon__row"));

beforeEach(() => {
  geometry.calls = 0;
});

describe("HorizonChart", () => {
  it("draws one row per series with a band per layer, on one x scale", () => {
    render(HorizonChart);

    expect(rows()).toHaveLength(2);
    expect(rows()[0].querySelectorAll(".bx--viz-horizon__band")).toHaveLength(
      3,
    );
    expect(rows()[1].querySelectorAll(".bx--viz-horizon__band")).toHaveLength(
      2,
    );
    expect(rows()[1].getAttribute("transform")).toBe("translate(0 20)");
    expect(chart().getAttribute("viewBox")).toBe("0 0 400 60");
    expect(
      Array.from(document.querySelectorAll(".bx--viz-horizon__label")).map(
        (n) => n.textContent?.trim(),
      ),
    ).toEqual(["a", "b"]);
  });

  it("gives assistive technology a summary of every series", () => {
    render(HorizonChart);

    const table = screen.getByRole("table", { name: "CPU by host" });
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) =>
          Array.from(row.children).map((cell) => cell.textContent?.trim()),
        ),
    ).toEqual([
      ["Series", "Latest", "Lowest", "Highest"],
      ["a", "90", "10", "90"],
      ["b", "60", "20", "60"],
    ]);
  });

  it("moves along x with the keyboard, announcing every series, without rebuilding", async () => {
    const onhover = vi.fn();
    render(HorizonChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith({
      x: 1,
      points: [
        { series: "a", value: 50 },
        { series: "b", value: null },
      ],
    });
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "1: a 50, b –",
    );
    expect(document.querySelector(".bx--viz-horizon__ruler")).not.toBeNull();
    expect(document.querySelector(".bx--viz-chart-tooltip")).toHaveTextContent(
      /a\s*50/,
    );
    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
    expect(geometry.calls).toBe(built);
  });

  it("follows hover published by another chart with the same sync id", async () => {
    const onhover = vi.fn();
    render(HorizonChart, { onhover, syncId: "ops" });
    const { joinSync } = await import("../../../src/viz/Chart/sync.js");
    const peer = joinSync("ops", () => {});

    peer.publish(2);
    expect(onhover).toHaveBeenLastCalledWith(expect.objectContaining({ x: 2 }));
    peer.publish(null);
    expect(onhover).toHaveBeenLastCalledWith(null);
    peer.leave();
  });
});
