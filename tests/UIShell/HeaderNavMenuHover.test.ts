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

  it("keeps a hover-opened menu open when the trigger is then clicked", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover);

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      const submenu = menuTrigger.closest(".bx--header__submenu");
      assert(submenu);

      await fireEvent.mouseEnter(submenu);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      // The click that usually follows a hover confirms the menu.
      await fireEvent.click(menuTrigger);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      // A second click closes it as before.
      await fireEvent.click(menuTrigger);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("opens on a click made before the hover delay, without a second toggle", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover);

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      const submenu = menuTrigger.closest(".bx--header__submenu");
      assert(submenu);

      await fireEvent.mouseEnter(submenu);
      await fireEvent.click(menuTrigger);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      await fireEvent.click(menuTrigger);
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

  it("does not move focus or the Tab stop when opened by hover", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover);

      const link = screen.getByRole("menuitem", { name: "Link 1" });
      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      const submenu = menuTrigger.closest(".bx--header__submenu");
      assert(submenu);
      link.focus();

      await fireEvent.mouseEnter(submenu);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
      expect(link).toHaveFocus();
      expect(link).toHaveAttribute("tabindex", "0");
      expect(menuTrigger).toHaveAttribute("tabindex", "-1");
      for (const item of screen.getAllByRole("menuitem", {
        name: /Menu Item/,
      })) {
        expect(item).not.toHaveFocus();
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes a hover-opened menu on Escape and restores trigger focus", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover);

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      const submenu = menuTrigger.closest(".bx--header__submenu");
      assert(submenu);

      await fireEvent.mouseEnter(submenu);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      menuTrigger.focus();
      await fireEvent.keyDown(menuTrigger, { key: "Escape" });
      await vi.advanceTimersByTimeAsync(0);

      expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
      expect(menuTrigger).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });

  it("closes a hover-opened menu on an outside click", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover);

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      const submenu = menuTrigger.closest(".bx--header__submenu");
      assert(submenu);

      await fireEvent.mouseEnter(submenu);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      // The dismiss listener attaches on a macrotask after opening.
      await vi.advanceTimersByTimeAsync(10);
      await fireEvent.click(document.body);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps a hover-opened menu open on mouseleave while focus is inside it", async () => {
    vi.useFakeTimers();
    try {
      render(HeaderNavMenuHover);

      const menuTrigger = screen.getByRole("menuitem", { name: "Menu" });
      const submenu = menuTrigger.closest(".bx--header__submenu");
      assert(submenu);

      await fireEvent.mouseEnter(submenu);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

      const item = screen.getByRole("menuitem", { name: "Menu Item 2" });
      item.focus();

      await fireEvent.mouseLeave(submenu);
      await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS * 2);

      expect(menuTrigger).toHaveAttribute("aria-expanded", "true");
      expect(item).toHaveFocus();
    } finally {
      vi.useRealTimers();
    }
  });
});
