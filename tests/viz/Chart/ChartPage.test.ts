import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import ChartPage from "./ChartPage.test.svelte";

describe("a page of charts", () => {
  it("hides a series everywhere when a legend hides it and hidden is shared", async () => {
    render(ChartPage);
    await user.click(
      within(screen.getByTestId("legend-a")).getByRole("button", { name: "a" }),
    );
    expect(screen.getByTestId("hidden-b")).toHaveTextContent("a");
  });

  it("pins a series' color across the page, under a chart's own colors", () => {
    render(ChartPage);
    const swatch = (legend: string, name: string) =>
      within(screen.getByTestId(legend))
        .getByRole("button", { name })
        .style.getPropertyValue("--bx-viz-color");
    expect(swatch("legend-a", "b")).toBe("var(--cds-viz-cat-05)");
    expect(swatch("legend-b", "b")).toBe("var(--cds-viz-cat-05)");
    expect(swatch("legend-b", "a")).toBe("var(--cds-viz-cat-09)");
  });
});
