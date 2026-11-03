import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import MenuButtonTransition from "./MenuButtonTransition.test.svelte";

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const trigger = () => screen.getByRole("button", { name: "Actions" });
const menu = () => screen.queryByRole("menu");

beforeEach(() => {
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("MenuButton menuTransition prop", () => {
  it("removes the menu at once on close when unset", async () => {
    render(MenuButtonTransition);
    await user.click(trigger());
    expect(menu()).toBeInTheDocument();

    await user.click(trigger());

    expect(menu()).not.toBeInTheDocument();
  });

  it("keeps the menu until the exit ends, with the trigger already closed", async () => {
    render(MenuButtonTransition, {
      menuTransition: { duration: DURATION * 4 },
    });
    await user.click(trigger());
    await sleep(DURATION * 8);

    await user.keyboard("{Escape}");

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
    expect(menu()).toBeInTheDocument();
    await waitFor(() => expect(menu()).not.toBeInTheDocument());
  });

  it("a click on the trigger during the exit opens the menu again", async () => {
    render(MenuButtonTransition, {
      menuTransition: { duration: DURATION * 4 },
    });
    await user.click(trigger());
    await sleep(DURATION * 8);
    await user.click(trigger());
    const leaving = menu();

    await user.click(trigger());
    await sleep(DURATION * 8);

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(menu()).toBe(leaving);
  });

  it("forwards outroend after the menu has left", async () => {
    const onOutroEnd = vi.fn();
    render(MenuButtonTransition, {
      menuTransition: { duration: DURATION },
      onOutroEnd,
    });
    await user.click(trigger());
    await sleep(DURATION * 4);

    await user.click(trigger());
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(menu()).not.toBeInTheDocument());
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });
});
