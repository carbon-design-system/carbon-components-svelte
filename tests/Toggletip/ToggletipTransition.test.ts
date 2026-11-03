import { render, screen, waitFor } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import type { MotionValue } from "../../src/motion/context.js";
import type { TransitionProp } from "../../src/motion/resolve-transition.js";
import type { FadeParams } from "../../src/motion/transitions.js";
import ToggletipTransition from "./ToggletipTransition.test.svelte";

const DURATION = 40;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const content = () => screen.queryByTestId("content");

/** The popover stays in the page in place and shows by its open class. */
const shown = () =>
  document
    .getElementById("tip-content")
    ?.classList.contains("bx--popover--open") ?? false;

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: reduce,
    media,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Open the toggletip with a click, and let a Svelte 5 entrance finish. */
async function openToggletip(props: {
  portalTooltip: boolean;
  transition?: TransitionProp<FadeParams>;
  motionTooltip?: MotionValue;
  onOutroEnd?: () => void;
  onIntroEnd?: () => void;
}) {
  const user = userEvent.setup();
  render(ToggletipTransition, props);
  const button = screen.getByRole("button");
  await user.click(button);
  expect(shown()).toBe(true);
  await sleep(DURATION * 4);
  return { user, button };
}

beforeEach(() => {
  // Svelte 3 and 4 compare the rAF timestamp to `performance.now()`, and
  // jsdom's rAF clock does not always match, which can hang an outro.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    setTimeout(() => callback(window.performance.now()), 16),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ["in place", false],
  ["in a portal", true],
] as const)("transition prop %s", (_, portalTooltip) => {
  it("hides at once on close when unset", async () => {
    const { user, button } = await openToggletip({ portalTooltip });

    await user.click(button);

    expect(shown()).toBe(false);
  });

  it("fades out with the tooltip role from Motion", async () => {
    const { user, button } = await openToggletip({
      portalTooltip,
      motionTooltip: { duration: DURATION },
    });

    await user.click(button);
    expect(shown()).toBe(true);
    await waitFor(() => expect(shown()).toBe(false));
  });

  it("fades out on close before hiding, then fires outroend", async () => {
    const onOutroEnd = vi.fn();
    const { user, button } = await openToggletip({
      portalTooltip,
      transition: { duration: DURATION },
      onOutroEnd,
    });

    await user.click(button);
    expect(shown()).toBe(true);
    expect(content()).toBeInTheDocument();
    expect(onOutroEnd).not.toHaveBeenCalled();

    await waitFor(() => expect(shown()).toBe(false));
    expect(content()).not.toBeInTheDocument();
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });

  it("fades out on Escape and keeps focus on the button", async () => {
    const { user, button } = await openToggletip({
      portalTooltip,
      transition: true,
    });

    await user.keyboard("{Escape}");
    expect(shown()).toBe(true);
    await waitFor(() => expect(shown()).toBe(false));

    expect(button).toHaveFocus();
  });

  it("hides without waiting under reduced motion", async () => {
    stubReducedMotion(true);
    const onOutroEnd = vi.fn();
    const { user, button } = await openToggletip({
      portalTooltip,
      transition: { duration: 10_000 },
      onOutroEnd,
    });

    await user.click(button);

    await waitFor(() => expect(shown()).toBe(false), { timeout: 100 });
    expect(onOutroEnd).toHaveBeenCalledTimes(1);
  });
});

describe("in place", () => {
  it("mounts the content only while open when animated", async () => {
    const user = userEvent.setup();
    render(ToggletipTransition, { transition: true });
    expect(content()).not.toBeInTheDocument();

    await user.click(screen.getByRole("button"));

    expect(content()).toBeInTheDocument();
  });

  it("forwards introend", async () => {
    const onIntroEnd = vi.fn();
    await openToggletip({
      portalTooltip: false,
      transition: { duration: DURATION },
      onIntroEnd,
    });

    expect(onIntroEnd).toHaveBeenCalledTimes(1);
  });
});
