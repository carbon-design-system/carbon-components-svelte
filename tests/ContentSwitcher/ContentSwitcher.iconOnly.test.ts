import { fireEvent, screen } from "@testing-library/svelte";
import type SwitchComponent from "carbon-components-svelte/ContentSwitcher/Switch.svelte";
import List from "carbon-icons-svelte/lib/List.svelte";
import { type ComponentProps, tick } from "svelte";
import { openTooltips } from "../utils/open-tooltips";
import IconOnly from "./ContentSwitcher.iconOnly.test.svelte";
import IconOnlyMixed from "./ContentSwitcher.iconOnlyMixed.test.svelte";
import { renderAndFlush } from "./helpers";

describe("ContentSwitcher (icon-only)", () => {
  // CSS fits the switcher with `:has()` on the switches' `--icon` class,
  // so the switcher sets no class of its own. e2e covers the widths.
  it("marks each icon switch and leaves the switcher unmarked", async () => {
    await renderAndFlush(IconOnly);

    for (const tab of screen.getAllByRole("tab"))
      expect(tab).toHaveClass("bx--content-switcher-btn--icon");
    expect(screen.getByRole("tablist")).not.toHaveClass(
      "bx--content-switcher--icon-only",
    );
  });

  it("renders an icon set after mount", async () => {
    const { rerender } = await renderAndFlush(IconOnlyMixed);

    await rerender({ plainIcon: List });
    await tick();

    const plain = screen.getByRole("tab", { name: "Plain" });
    expect(plain).toHaveAttribute("aria-label", "Plain");
    expect(plain).toHaveClass("bx--content-switcher-btn--icon");
    expect(plain.querySelector("svg")).toBeInTheDocument();
  });

  it("drops the icon mark when `icon` is unset after mount", async () => {
    const { rerender } = await renderAndFlush(IconOnlyMixed, {
      props: { plainIcon: List },
    });

    await rerender({ plainIcon: undefined });
    await tick();

    const plain = screen.getByRole("tab", { name: "Plain" });
    expect(plain).not.toHaveClass("bx--content-switcher-btn--icon");
    expect(plain).not.toHaveAttribute("aria-label");
    expect(plain).toHaveTextContent("Plain");
  });

  it("labels each icon switch with `text` and renders the icon, not a text label", async () => {
    const { container } = await renderAndFlush(IconOnly);

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
      await renderAndFlush(IconOnly);

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
    await renderAndFlush(IconOnly);

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
      await renderAndFlush(IconOnly);

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
      await renderAndFlush(IconOnly, { props: { disabledLast: true } });

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
    await renderAndFlush(IconOnly, { props: { tooltipAlignment: "start" } });

    const dashboard = screen.getByRole("tab", { name: "Dashboard" });
    await fireEvent.focus(dashboard);
    await tick();

    const portal = document.querySelector("[data-floating-portal]");
    expect(portal).toHaveAttribute("data-floating-intrinsic-align", "start");
  });

  describe("Generics", () => {
    it("types the `icon` prop through the @template parameter", () => {
      type MyIcon = typeof List;
      type ComponentType = SwitchComponent<MyIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<MyIcon | undefined>();
      expectTypeOf<Props["tooltipAlignment"]>().toEqualTypeOf<
        "start" | "center" | "end" | undefined
      >();
    });
  });
});
