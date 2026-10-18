import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import { setViewportWidth } from "../utils/viewport";
import SideNavMobileFocusTrapTest from "./SideNavMobileFocusTrap.test.svelte";

describe("SideNav mobile focus trap", () => {
  afterEach(() => {
    setViewportWidth(1024);
  });

  it.each([
    { start: "Third", keys: "{Tab}", end: "First" },
    { start: "First", keys: "{Shift>}{Tab}{/Shift}", end: "Third" },
  ])(
    "wraps $keys from $start to $end when open on mobile",
    async ({ start, keys, end }) => {
      setViewportWidth(320);

      render(SideNavMobileFocusTrapTest, { props: { isOpen: true } });
      await tick();

      const from = screen.getByRole("link", { name: start });
      const to = screen.getByRole("link", { name: end });

      from.focus();
      expect(from).toHaveFocus();

      await user.keyboard(keys);

      expect(to).toHaveFocus();
    },
  );

  it.each([
    { width: 320, fixed: true },
    { width: 1280, fixed: false },
  ])(
    "does not trap focus at width $width with fixed $fixed",
    async ({ width, fixed }) => {
      setViewportWidth(width);

      render(SideNavMobileFocusTrapTest, { props: { isOpen: true, fixed } });
      await tick();

      const first = screen.getByRole("link", { name: "First" });
      const last = screen.getByRole("link", { name: "Third" });

      last.focus();
      expect(last).toHaveFocus();

      await user.keyboard("{Tab}");

      expect(first).not.toHaveFocus();
    },
  );
});
