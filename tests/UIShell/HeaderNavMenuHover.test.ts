import assert from "node:assert/strict";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import HeaderNavMenuHover from "./HeaderNavMenuHover.test.svelte";

/** HeaderNavMenu's hover-open/close delay. */
const HOVER_DELAY_MS = 150;

describe("HeaderNavMenu openOnHover", () => {
  it("opens the menu on hover after a delay", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover);

      const submenu = screen
        .getByRole("menuitem", { name: "Menu" })
        .closest(".bx--header__submenu");
      assert(submenu);

      await fireEvent.mouseEnter(submenu);
      expect(screen.getByRole("menuitem", { name: "Menu" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );

      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(screen.getByRole("menuitem", { name: "Menu" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes the menu after the pointer leaves and the delay elapses", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover);

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      const submenu = menuTrigger.closest(".bx--header__submenu");
      assert(submenu);

      await fireEvent.mouseEnter(submenu);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      await fireEvent.mouseLeave(submenu);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not open on hover when openOnHover is false", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover, { props: { openOnHover: false } });

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      const submenu = menuTrigger.closest(".bx--header__submenu");
      assert(submenu);

      await fireEvent.mouseEnter(submenu);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("still toggles with keyboard when openOnHover is enabled", async () => {
    render(HeaderNavMenuHover);

    const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
    menuTrigger.focus();

    await user.keyboard("{Enter}");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    expect(menuTrigger).toHaveFocus();
  });
});
