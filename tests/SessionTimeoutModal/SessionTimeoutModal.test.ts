import { act, fireEvent, render, screen } from "@testing-library/svelte";
import { createIdleTimer, type IdleTimer } from "../../src/utils/idle-timer.js";
import SessionTimeoutModal from "./SessionTimeoutModal.test.svelte";

const MIN = 60_000;
const T0 = 1_700_000_000_000;

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const isOpen = () =>
  document.querySelector(".bx--modal")?.classList.contains("is-visible");
const status = () => document.querySelector("[role=status]")?.textContent;

describe("SessionTimeoutModal", () => {
  let timer: IdleTimer;

  function setup(props: Record<string, unknown> = {}, options = {}) {
    timer = createIdleTimer({
      timeout: 15 * MIN,
      warnBefore: 2 * MIN,
      ...options,
    });
    return render(SessionTimeoutModal, { props: { timer, ...props } });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    timer.stop();
    vi.useRealTimers();
  });

  it("stays closed while the session is active, then opens as an alert dialog", async () => {
    setup();
    expect(isOpen()).toBe(false);

    await advance(13 * MIN);
    expect(isOpen()).toBe(true);
    const dialog = screen.getByRole("alertdialog", {
      name: "Your session is about to end",
    });
    expect(dialog).toHaveTextContent(
      "You have been inactive. Your session will end in 2:00.",
    );
  });

  it("counts down on screen every second", async () => {
    setup();
    await advance(13 * MIN + 3000);
    expect(screen.getByRole("timer")).toHaveTextContent("1:57");
    await advance(1000);
    expect(screen.getByRole("timer")).toHaveTextContent("1:56");
  });

  it("puts initial focus on Stay signed in", async () => {
    setup();
    await advance(13 * MIN);
    expect(
      screen.getByRole("button", { name: "Stay signed in" }),
    ).toHaveFocus();
  });

  it("is not dismissed by activity, Escape or a click outside", async () => {
    setup();
    await advance(13 * MIN);
    await fireEvent.keyDown(document.body, { key: "a" });
    await advance(2000);
    await fireEvent.keyDown(screen.getByRole("alertdialog"), {
      key: "Escape",
    });
    const root = document.querySelector(".bx--modal") as HTMLElement;
    await fireEvent.mouseDown(root);
    await fireEvent.mouseUp(root);
    expect(isOpen()).toBe(true);
    expect(
      screen.queryByRole("button", { name: "Close the modal" }),
    ).toBeNull();
  });

  it("keeps the session on Stay signed in", async () => {
    const onextend = vi.fn();
    setup({ onextend });
    await advance(13 * MIN);
    await fireEvent.click(
      screen.getByRole("button", { name: "Stay signed in" }),
    );
    await advance(0);
    expect(onextend).toHaveBeenCalledTimes(1);
    expect(isOpen()).toBe(false);
    await advance(13 * MIN);
    expect(isOpen()).toBe(true);
  });

  it("ends the session for good on Sign out, and offers Sign in", async () => {
    const onsignout = vi.fn();
    const onsignin = vi.fn();
    const onExpire = vi.fn();
    setup({ onsignout, onsignin }, { onExpire });
    await advance(13 * MIN);
    await fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    await advance(0);

    expect(onsignout).toHaveBeenCalledTimes(1);
    expect(onExpire).toHaveBeenCalledWith({ reason: "signout", remote: false });
    screen.getByRole("alertdialog", { name: "You've been signed out" });
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
    // The button that was pressed is gone; focus stays in the dialog.
    expect(screen.getByRole("button", { name: "Sign in" })).toHaveFocus();
    await fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onsignin).toHaveBeenCalledTimes(1);
  });

  it("shows the ended state at once when the clock jumps past the end", async () => {
    setup();
    await advance(5 * MIN);
    vi.setSystemTime(T0 + 60 * MIN);
    await act(() => document.dispatchEvent(new Event("visibilitychange")));
    screen.getByRole("alertdialog", { name: "You've been signed out" });
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "Your session ended because you were inactive",
    );
  });

  it("says the thresholds, not every second", async () => {
    setup();
    await advance(13 * MIN);
    const heard: string[] = [];
    for (let second = 0; second < 120; second++) {
      // eslint-disable-next-line no-await-in-loop -- the second-by-second order is the point
      await advance(1000);
      const text = status() ?? "";
      if (heard.at(-1) !== text) heard.push(text);
    }
    const said = heard.filter(Boolean);
    expect(said.slice(0, -1)).toEqual([
      "Your session will end in 1 minute",
      "Your session will end in 30 seconds",
      "Your session will end in 10 seconds",
    ]);
    expect(said.at(-1)).toContain("You've been signed out");
  });

  it("skips thresholds already passed when it opens, and clears on extend", async () => {
    setup({ announceAt: [60, 30, 10] }, { warnBefore: 25_000 });
    await advance(15 * MIN - 25_000);
    expect(status()).toBe("");
    await advance(15_001);
    expect(status()).toBe("Your session will end in 10 seconds");
    await fireEvent.click(
      screen.getByRole("button", { name: "Stay signed in" }),
    );
    await advance(0);
    expect(status()).toBe("");
  });

  it("drops a threshold that fires too late to be true", async () => {
    setup();
    await advance(13 * MIN);
    // A throttled tab: the clock moves 100 seconds before the 30 s timer runs.
    vi.setSystemTime(T0 + 13 * MIN + 100_000);
    await advance(30_000);
    expect(status()).not.toBe("Your session will end in 30 seconds");
  });

  it("words a sign-out differently from a timeout", async () => {
    setup();
    await act(() => timer.signOut());
    screen.getByRole("alertdialog", { name: "You've been signed out" });
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "You were signed out.",
    );
  });

  it("shows an error and stays open when the server cannot extend", async () => {
    setup({}, { onExtend: () => Promise.reject(new Error("503")) });
    await advance(13 * MIN);
    await fireEvent.click(
      screen.getByRole("button", { name: "Stay signed in" }),
    );
    await advance(0);
    expect(isOpen()).toBe(true);
    screen.getByText("We could not extend your session. Try again.");
    expect(
      screen.getByRole("button", { name: "Stay signed in" }),
    ).toBeEnabled();
  });
});
