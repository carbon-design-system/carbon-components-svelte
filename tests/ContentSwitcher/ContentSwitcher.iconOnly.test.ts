import { fireEvent, render, screen } from "@testing-library/svelte";
import type SwitchComponent from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
import { type ComponentProps, tick } from "svelte";
import IconOnly from "./ContentSwitcher.iconOnly.test.svelte";
import IconOnlyMixed from "./ContentSwitcher.iconOnlyMixed.test.svelte";

/** Open tooltips currently rendered in the portal. */
function openTooltips() {
  return Array.from(document.querySelectorAll(".bx--tooltip-portal__content"));
}

describe("ContentSwitcher (icon-only)", () => {
  it("infers the icon-only variant when every Switch sets `icon`", async () => {
    render(IconOnly);
    await tick();
    await tick();

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass("bx--content-switcher--icon-only");
  });

  it("does not infer icon-only when a Switch has no `icon`", async () => {
    render(IconOnlyMixed);
    await tick();
    await tick();

    expect(screen.getByRole("tablist")).not.toHaveClass(
      "bx--content-switcher--icon-only",
    );
  });

  it("labels each icon switch with `text` and renders the icon, not a text label", async () => {
    const { container } = render(IconOnly);
    await tick();
    await tick();

    const dashboard = screen.getByRole("tab", { name: "Dashboard" });
    expect(dashboard).toHaveAttribute("aria-label", "Dashboard");
    expect(dashboard).not.toHaveTextContent("Dashboard");
    expect(dashboard.querySelector("svg")).toBeInTheDocument();

    expect(
      container.querySelector(".bx--content-switcher__label"),
    ).not.toBeInTheDocument();
  });

  it("opens a tooltip on hover after the enter delay and closes after the leave delay", async () => {
    vi.useFakeTimers();
    try {
      render(IconOnly);
      await tick();
      await tick();

      const dashboard = screen.getByRole("tab", { name: "Dashboard" });

      await fireEvent.mouseEnter(dashboard);
      // Nothing yet: the enter delay has not elapsed.
      expect(openTooltips()).toHaveLength(0);

      await vi.advanceTimersByTimeAsync(120);
      expect(openTooltips()).toHaveLength(1);
      expect(openTooltips()[0]).toHaveTextContent("Dashboard");

      await fireEvent.mouseLeave(dashboard);
      await vi.advanceTimersByTimeAsync(320);
      expect(openTooltips()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("opens a tooltip on focus and closes on blur", async () => {
    render(IconOnly);
    await tick();
    await tick();

    const dashboard = screen.getByRole("tab", { name: "Dashboard" });

    await fireEvent.focus(dashboard);
    await tick();
    expect(openTooltips()).toHaveLength(1);
    expect(openTooltips()[0]).toHaveTextContent("Dashboard");

    await fireEvent.blur(dashboard);
    await tick();
    expect(openTooltips()).toHaveLength(0);
  });

  it("shows only one tooltip at a time (warm handoff between neighbors)", async () => {
    vi.useFakeTimers();
    try {
      render(IconOnly);
      await tick();
      await tick();

      const toc = screen.getByRole("tab", { name: "Table of contents" });
      const dashboard = screen.getByRole("tab", { name: "Dashboard" });

      await fireEvent.mouseEnter(toc);
      await vi.advanceTimersByTimeAsync(120);
      expect(openTooltips()).toHaveLength(1);
      expect(openTooltips()[0]).toHaveTextContent("Table of contents");

      // Moving to a neighbor reveals it immediately and closes the previous one.
      await fireEvent.mouseLeave(toc);
      await fireEvent.mouseEnter(dashboard);
      await tick();
      expect(openTooltips()).toHaveLength(1);
      expect(openTooltips()[0]).toHaveTextContent("Dashboard");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not open a tooltip for a disabled switch", async () => {
    vi.useFakeTimers();
    try {
      render(IconOnly, { props: { disabledLast: true } });
      await tick();
      await tick();

      const list = screen.getByRole("tab", { name: "List" });
      expect(list).toBeDisabled();

      await fireEvent.mouseEnter(list);
      await vi.advanceTimersByTimeAsync(200);
      expect(openTooltips()).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("aligns the tooltip per `tooltipAlignment`", async () => {
    render(IconOnly, { props: { tooltipAlignment: "start" } });
    await tick();
    await tick();

    const dashboard = screen.getByRole("tab", { name: "Dashboard" });
    await fireEvent.focus(dashboard);
    await tick();

    const portal = document.querySelector("[data-floating-portal]");
    expect(portal).toHaveAttribute("data-floating-intrinsic-align", "start");
  });

  describe("Generics", () => {
    it("types the `icon` prop through the @template parameter", () => {
      type MyIcon = { $$prop_def: Record<string, never> };
      type ComponentType = SwitchComponent<MyIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<MyIcon | undefined>();
      expectTypeOf<Props["tooltipAlignment"]>().toEqualTypeOf<
        "start" | "center" | "end" | undefined
      >();
    });
  });
});
