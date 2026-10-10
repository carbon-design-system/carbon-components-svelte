import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import SmallMultiples from "./SmallMultiples.test.svelte";

const chart = (name: string) => screen.getByRole("application", { name });
const yLabels = (name: string) =>
  Array.from(
    chart(name)
      .closest("figure")
      ?.querySelectorAll(".bx--viz-axis--left .bx--viz-axis__label") ?? [],
  ).map((node) => node.textContent);

describe("SmallMultiples", () => {
  it("renders one chart per facet in first-seen order, in a grid", () => {
    render(SmallMultiples);

    const grid = screen.getByTestId("facets");
    expect(grid).toHaveTextContent("Revenue by region");
    expect(
      within(grid)
        .getAllByRole("application")
        .map((node) => node.getAttribute("aria-label")),
    ).toEqual(["a", "b", "c"]);
    expect(
      (
        grid.querySelector(".bx--viz-facets__grid") as HTMLElement
      ).style.getPropertyValue("--bx-viz-columns"),
    ).toBe("3");
  });

  it("gives every chart the same y scale, from zero to the largest value", () => {
    render(SmallMultiples);

    // c tops out at 100; a alone would stop near 40.
    expect(yLabels("a")).toEqual(yLabels("c"));
    expect(yLabels("a")).toContain("100");
    expect(yLabels("a")).toContain("0");
  });

  it("lets each chart fit its own data when sharing is off", () => {
    render(SmallMultiples, { sharedY: false });

    expect(yLabels("a")).not.toEqual(yLabels("c"));
    expect(yLabels("a")).not.toContain("100");
  });

  it("carries hover across the charts", async () => {
    const onhover = vi.fn();
    render(SmallMultiples, { onhover });

    chart("a").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover).toHaveBeenCalledWith(
      "b",
      expect.objectContaining({ x: 1 }),
    );
    expect(onhover).toHaveBeenCalledWith(
      "c",
      expect.objectContaining({ x: 1 }),
    );
  });

  it("keeps hover to one chart when sync is off", async () => {
    const onhover = vi.fn();
    render(SmallMultiples, { onhover, syncHover: false });

    chart("a").focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(onhover.mock.calls.map(([facet]) => facet)).toEqual(
      expect.not.arrayContaining(["b", "c"]),
    );
  });
});
