import { render, screen, waitFor } from "@testing-library/svelte";
import type * as TransitionsModule from "../../src/motion/transitions.js";
import { fade, slide } from "../../src/motion/transitions.js";
import { user } from "../utils/user";
import DropdownMenuTransition from "./DropdownMenuTransition.test.svelte";

// Wrap the Carbon slide and fade so the test can see the params they run with.
vi.mock("../../src/motion/transitions.js", async (importOriginal) => {
  const original = await importOriginal<typeof TransitionsModule>();
  return {
    ...original,
    slide: vi.fn(original.slide),
    fade: vi.fn(original.fade),
  };
});

/** The preset's transition: a slide in place, a fade in a portal. */
const preset = (portal: boolean) => vi.mocked(portal ? fade : slide);

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const menu = () => document.getElementById("menu-field");

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

beforeEach(() => {
  vi.mocked(slide).mockClear();
  vi.mocked(fade).mockClear();
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ["Dropdown", "dropdown"],
  ["ComboBox", "combo-box"],
  ["MultiSelect", "multi-select"],
] as const)("%s menuTransition", (_, kind) => {
  describe.each([
    ["in place", false],
    ["in a portal", true],
  ])("%s", (_, portalMenu) => {
    async function openMenu(menuTransition?: object | boolean) {
      render(DropdownMenuTransition, { kind, portalMenu, menuTransition });
      const trigger = screen.getByRole("combobox");
      await user.click(trigger);
      expect(menu()).toBeInTheDocument();
      // Let a Svelte 5 entrance finish before testing the exit.
      await sleep(DURATION * 4);
      return trigger;
    }

    it("closes at once when unset", async () => {
      const trigger = await openMenu();

      await user.keyboard("{Escape}");

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(menu()).not.toBeInTheDocument();
      expect(slide).not.toHaveBeenCalled();
      expect(fade).not.toHaveBeenCalled();
    });

    it("plays the preset at fast02 and keeps the menu until outroend", async () => {
      const trigger = await openMenu(true);
      const leaving = menu() as HTMLElement & { inert: boolean };
      const onOutroEnd = vi.fn();
      leaving.addEventListener("outroend", onOutroEnd);

      await user.keyboard("{Escape}");

      // The trigger reports closed and the menu takes no clicks while it
      // leaves.
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(trigger).not.toHaveAttribute("aria-controls", "menu-field");
      expect(menu()).toBe(leaving);
      expect(leaving.inert).toBe(true);

      await waitFor(() => expect(menu()).not.toBeInTheDocument());
      expect(onOutroEnd).toHaveBeenCalledTimes(1);
      expect(preset(portalMenu).mock.calls.at(-1)?.[1]).toEqual({
        duration: "fast02",
      });
    });

    it("passes params through", async () => {
      await openMenu({ duration: DURATION });

      expect(preset(portalMenu).mock.calls.at(-1)?.[1]).toEqual({
        duration: DURATION,
      });
    });

    it("closes at once under reduced motion", async () => {
      stubReducedMotion(true);
      await openMenu({ duration: 10_000 });

      await user.keyboard("{Escape}");

      await waitFor(() => expect(menu()).not.toBeInTheDocument(), {
        timeout: 100,
      });
    });
  });
});
