import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import AlluvialChart from "./AlluvialChart.test.svelte";

const geometry = vi.hoisted(() => ({ calls: 0 }));

vi.mock(
  "../../../src/viz/AlluvialChart/alluvial-geometry.js",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("../../../src/viz/AlluvialChart/alluvial-geometry.js")
      >();
    return {
      ...actual,
      buildAlluvial: (...args: Parameters<typeof actual.buildAlluvial>) => {
        geometry.calls += 1;
        return actual.buildAlluvial(...args);
      },
    };
  },
);

const chart = () =>
  screen.getByRole("application", { name: "Acquisition flow" });

beforeEach(() => {
  geometry.calls = 0;
});

describe("AlluvialChart", () => {
  it("draws a node per name and a ribbon per pair, summing shared pairs", () => {
    render(AlluvialChart);

    expect(document.querySelectorAll(".bx--viz-alluvial__node")).toHaveLength(
      5,
    );
    const links = document.querySelectorAll(".bx--viz-alluvial__link");
    expect(links).toHaveLength(4);
    expect(
      Array.from(links).map((link) => link.querySelector("title")?.textContent),
    ).toContain("Paid → Signup: 40");
  });

  it("gives assistive technology every flow as a table", () => {
    render(AlluvialChart);

    const table = screen.getByRole("table", { name: "Acquisition flow" });
    expect(
      within(table)
        .getAllByRole("row")
        .map((row) =>
          Array.from(row.children).map((cell) => cell.textContent?.trim()),
        ),
    ).toEqual([
      ["From", "To", "Value"],
      ["Organic", "Signup", "60"],
      ["Paid", "Signup", "40"],
      ["Signup", "Activated", "70"],
      ["Signup", "Churned", "30"],
    ]);
  });

  it("moves node to node in reading order, emphasizing its flows, without a rebuild", async () => {
    const onhover = vi.fn();
    render(AlluvialChart, { onhover });
    const built = geometry.calls;

    chart().focus();
    await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
    // Two sources, then Signup.
    expect(onhover).toHaveBeenLastCalledWith({
      node: expect.objectContaining({
        id: "Signup",
        incoming: 100,
        outgoing: 100,
      }),
    });
    expect(
      document.querySelectorAll(".bx--viz-alluvial__link--active"),
    ).toHaveLength(4);
    expect(document.querySelector("[aria-live]")).toHaveTextContent(
      "Signup: 100",
    );
    expect(chart()).toHaveClass("bx--viz-alluvial__svg--emphasis");
    expect(geometry.calls).toBe(built);

    await user.keyboard("{Escape}");
    expect(onhover).toHaveBeenLastCalledWith(null);
  });

  it("selects the focused node with the flows it touches", async () => {
    const onselect = vi.fn();
    render(AlluvialChart, { onselect });

    chart().focus();
    await user.keyboard("{End}{Enter}");
    const detail = onselect.mock.calls[0][0];
    expect(["Activated", "Churned"]).toContain(detail.node.id);
    expect(detail.links).toHaveLength(1);
    expect(detail.links[0].source).toBe("Signup");
  });
});
