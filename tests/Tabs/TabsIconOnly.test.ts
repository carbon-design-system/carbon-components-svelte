import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { openTooltips } from "../utils/open-tooltips";
import TabsIconOnly from "./TabsIconOnly.test.svelte";

describe("Tabs (icon-only)", () => {
  it("renders the icon-only variant when `iconOnly` is set", async () => {
    render(TabsIconOnly);
    await tick();
    await tick();

    expect(screen.getByRole("navigation")).toHaveClass("bx--tabs--icon-only");
  });

  it("renders icons beside labels (not icon-only) by default", async () => {
    render(TabsIconOnly, { props: { iconOnly: false } });
    await tick();
    await tick();

    expect(screen.getByRole("navigation")).not.toHaveClass(
      "bx--tabs--icon-only",
    );
    expect(screen.getByRole("tab", { name: "Calendar" })).toHaveTextContent(
      "Calendar",
    );
  });

  it("labels each icon tab with `label` and renders the icon, not visible text", async () => {
    render(TabsIconOnly);
    await tick();
    await tick();

    const settings = screen.getByRole("tab", { name: "Settings" });
    expect(settings).toHaveAttribute("aria-label", "Settings");
    expect(settings.querySelector("svg")).toBeInTheDocument();
  });

  it("ignores autoWidth and fullWidth so icon tabs stay square", async () => {
    const { rerender } = render(TabsIconOnly, {
      props: { autoWidth: true, fullWidth: true },
    });
    await tick();
    await tick();

    for (const tab of screen.getAllByRole("tab")) {
      expect(tab.style.width).toBe("");
    }

    // The width applies again once the tabs are no longer icon-only.
    await rerender({ iconOnly: false });
    for (const tab of screen.getAllByRole("tab")) {
      expect(tab.style.width).toBe("100%");
    }
  });

  it("opens a tooltip on focus and closes on blur", async () => {
    render(TabsIconOnly);
    await tick();
    await tick();

    const settings = screen.getByRole("tab", { name: "Settings" });

    await fireEvent.focus(settings);
    await tick();
    expect(openTooltips()).toHaveLength(1);
    expect(openTooltips()[0]).toHaveTextContent("Settings");

    await fireEvent.blur(settings);
    await tick();
    expect(openTooltips()).toHaveLength(0);
  });

  it("does not open a tooltip for a disabled icon tab", async () => {
    render(TabsIconOnly, { props: { disabledFirst: true } });
    await tick();
    await tick();

    const calendar = screen.getByRole("tab", { name: "Calendar" });
    await fireEvent.focus(calendar);
    await tick();
    expect(openTooltips()).toHaveLength(0);
  });

  it("aligns the tooltip per `tooltipAlignment`", async () => {
    render(TabsIconOnly, { props: { tooltipAlignment: "start" } });
    await tick();
    await tick();

    const settings = screen.getByRole("tab", { name: "Settings" });
    await fireEvent.focus(settings);
    await tick();

    const portal = document.querySelector("[data-floating-portal]");
    expect(portal).toHaveAttribute("data-floating-intrinsic-align", "start");
  });

  it("applies the large icon scale via `iconSize`", async () => {
    render(TabsIconOnly, { props: { iconSize: "lg" } });
    await tick();
    await tick();

    expect(screen.getByRole("navigation")).toHaveClass("bx--tabs__icon--lg");
  });
});
