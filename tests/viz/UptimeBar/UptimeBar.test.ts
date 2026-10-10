import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import UptimeBar from "./UptimeBar.test.svelte";

describe("UptimeBar", () => {
  it("names the image with the uptime over the measured periods", () => {
    render(UptimeBar);

    // 3 of the 4 measured periods were not down.
    const root = screen.getByRole("img", { name: "API: 75% uptime" });
    expect(root).toBe(screen.getByTestId("basic"));
    expect(root.querySelector(".bx--viz-uptime__value")).toHaveTextContent(
      "75% uptime",
    );
  });

  it("is decorative without a label and writes no value by default", () => {
    render(UptimeBar);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelector(".bx--viz-uptime__value")).toBeNull();
  });

  it("gives each status its own class, so shape never rests on color", () => {
    render(UptimeBar);

    const periods = Array.from(
      screen.getByTestId("basic").querySelectorAll(".bx--viz-uptime__period"),
    );
    expect(periods.map((p) => p.className.match(/period--(\w+)/)?.[1])).toEqual(
      ["none", "ok", "degraded", "down", "ok"],
    );
    expect(
      within(screen.getByTestId("basic")).queryAllByRole("button"),
    ).toEqual([]);
  });

  it("has no uptime when nothing was measured", () => {
    render(UptimeBar);

    const root = screen.getByTestId("unmeasured");
    expect(root).toHaveAccessibleName("New service");
    expect(root.querySelector(".bx--viz-uptime__value")).toBeNull();
  });

  it("selects a period by click and keyboard, with translated names", async () => {
    const onselect = vi.fn();
    render(UptimeBar, { props: { onselect } });

    const group = screen.getByRole("group", {
      name: "API wählen: 75% verfügbar",
    });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Mar 1: No data",
      "Mar 2: Operational",
      "Mar 3: Degraded",
      "Mar 4: Ausfall",
      "Mar 5: Operational",
    ]);
    // The newest period is the tab stop.
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, -1, -1, -1, 0]);

    await user.click(buttons[3]);
    expect(buttons[3]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("3");
    expect(onselect).toHaveBeenCalledWith({
      period: { status: "down", label: "Mar 4" },
      index: 3,
    });

    await user.keyboard("{ArrowLeft}");
    expect(buttons[2]).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("2");
  });
});
