import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import FunnelChart from "./FunnelChart.test.svelte";

const table = () => screen.getByRole("table", { name: /Signup funnel/ });
const rows = () =>
  Array.from(
    table().querySelectorAll<HTMLElement>(".bx--viz-funnel-bars__row"),
  );

describe("FunnelChart", () => {
  it("shows the title once to sighted users and names the table with it", () => {
    render(FunnelChart);

    expect(table()).toHaveAccessibleName(
      "Signup funnel. Overall conversion 9%",
    );
    const title = document.querySelector(".bx--viz-funnel-chart > div");
    expect(title).toHaveTextContent("Signup funnel");
    expect(title).toHaveAttribute("aria-hidden", "true");
  });

  it("tapers each stage toward the next, and the last toward itself", () => {
    render(FunnelChart);

    expect(table()).toHaveClass(
      "bx--viz-funnel-bars--tapered",
      "bx--viz-funnel-bars--center",
      "bx--viz-funnel-bars--lg",
    );
    expect(
      rows().map((row) => [
        row.style.getPropertyValue("--bx-viz-pct"),
        row.style.getPropertyValue("--bx-viz-next-pct"),
      ]),
    ).toEqual([
      ["100", "60"],
      ["60", "9"],
      ["9", "9"],
    ]);
  });

  it("shows the overall conversion for each stage by default", () => {
    render(FunnelChart);

    expect(
      within(table())
        .getAllByRole("row")
        .slice(1)
        .map((row) =>
          Array.from(row.children)
            .map((cell) => cell.textContent?.trim() ?? "")
            .filter(Boolean),
        ),
    ).toEqual([
      ["Visitors", "10K", "100%"],
      ["Signup", "6K", "60%"],
      ["Paid", "900", "9%"],
    ]);
  });

  it("keeps centered bars with no slopes as bars", () => {
    render(FunnelChart, { shape: "bars" });

    expect(table()).not.toHaveClass("bx--viz-funnel-bars--tapered");
    expect(table()).toHaveClass("bx--viz-funnel-bars--center");
    expect(rows()[0].style.getPropertyValue("--bx-viz-next-pct")).toBe("");
  });

  it("passes selection through", async () => {
    const onselect = vi.fn();
    render(FunnelChart, { onselect });

    await user.click(within(table()).getByRole("button", { name: "Signup" }));
    expect(screen.getByTestId("selected")).toHaveTextContent("signup");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({ index: 1 }),
    );
  });
});
