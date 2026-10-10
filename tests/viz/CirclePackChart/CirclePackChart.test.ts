import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import CirclePackChart from "./CirclePackChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/CirclePackChart/pack-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/CirclePackChart/pack-geometry.js")
      >();
    return {
      ...actual,
      buildPack: (...args: Parameters<typeof actual.buildPack>) => {
        geometry.calls += 1;
        return actual.buildPack(...args);
      },
    };
  },
);

const chart = () =>
  screen.getByRole("application", { name: "Commits by repository" });
const text = (node: Element) => node.textContent?.replace(/\s+/g, " ").trim();

beforeEach(() => {
  geometry.calls = 0;
});

describe("CirclePackChart", () => {
  it("draws a circle per leaf inside an outline per group", () => {
    render(CirclePackChart);

    expect(document.querySelectorAll(".bx--viz-pack__leaf")).toHaveLength(4);
    expect(document.querySelectorAll(".bx--viz-pack__group")).toHaveLength(2);
    expect(
      Array.from(
        document.querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map(text),
    ).toEqual(["Platform", "Data"]);
  });

  it("gives assistive technology every value as an outline", () => {
    render(CirclePackChart);

    const lists = within(screen.getByTestId("pack")).getAllByRole("list");
    // The legend is hidden from it, which leaves the outline and its two sublists.
    expect(lists).toHaveLength(3);
    expect(
      within(lists[0])
        .getAllByRole("listitem")
        .map(text)
        .filter((item) => !item?.includes(" gateway")),
    ).toContain("gateway: 400");
    expect(within(lists[1]).getAllByRole("listitem").map(text)).toEqual([
      "gateway: 400",
      "scheduler: 225",
    ]);
  });

  it("has no outlines or legend without groups", () => {
    render(CirclePackChart, { grouped: false });

    expect(document.querySelectorAll(".bx--viz-pack__group")).toHaveLength(0);
    expect(document.querySelector(".bx--viz-treemap__legend")).toBeNull();
    expect(document.querySelectorAll(".bx--viz-pack__leaf")).toHaveLength(4);
  });

  it("moves circle to circle with the keyboard, without repacking, and selects", async () => {
    const onhover = vi.fn();
    const onselect = vi.fn();
    render(CirclePackChart, { onhover, onselect });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "Platform/scheduler", value: 225 }),
    );
    expect(
      document.querySelectorAll(".bx--viz-pack__leaf--active"),
    ).toHaveLength(1);
    const tooltip = document.querySelector(".bx--viz-chart-tooltip");
    expect(tooltip).toHaveTextContent("Platform");
    expect(tooltip).toHaveTextContent(/scheduler\s*225/);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Platform: scheduler 225",
    );
    expect(geometry.calls).toBe(built);

    await user.keyboard("{Enter}");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      leaf: { key: "scheduler", group: "Platform" },
    });
  });
});
