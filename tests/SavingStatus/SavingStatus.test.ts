/* eslint-disable no-await-in-loop -- the clock steps one keystroke at a time */
import { act, fireEvent, render, screen } from "@testing-library/svelte";
import SavingStatus from "carbon-components-svelte/SavingStatus/SavingStatus.svelte";
import { createAutosave } from "../../src/utils/autosave.js";
import SavingStatusRetry from "./SavingStatusRetry.test.svelte";

const advance = async (ms: number) => {
  await act(() => vi.advanceTimersByTimeAsync(ms));
};

const polite = () => document.querySelector<HTMLElement>('[role="status"]');
const assertive = () => document.querySelector<HTMLElement>('[role="alert"]');
const text = () => root()?.textContent?.replace(/\s+/g, " ").trim() ?? "";
const root = () => document.querySelector<HTMLElement>(".bx--saving-status");

describe("SavingStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("statuses", () => {
    it("renders nothing visible when idle, and keeps both live regions", () => {
      render(SavingStatus);
      expect(root()).toHaveTextContent("");
      expect(polite()).toBeInTheDocument();
      expect(assertive()).toBeInTheDocument();
    });

    it.each([
      ["unsaved", "Unsaved changes"],
      ["saving", "Saving…"],
      ["saved", "Saved"],
      ["error", "Couldn't save"],
      ["offline", "Offline: changes will save when you reconnect"],
    ] as const)("renders %s as %s", (status, text) => {
      render(SavingStatus, { status });
      expect(root()).toHaveTextContent(text);
    });

    it("marks the saved time and gives the exact time in a tooltip", () => {
      const savedAt = new Date("2026-01-01T12:00:00Z");
      render(SavingStatus, {
        status: "saved",
        savedAt,
        locale: "en-US",
      });
      const time = document.querySelector("time");
      expect(time).toHaveAttribute("datetime", savedAt.toISOString());
      expect(time).toHaveAttribute("title");
      expect(time).toHaveTextContent(/^Saved$/);
    });

    it("says how long ago once the minute has passed", async () => {
      render(SavingStatus, {
        status: "saved",
        savedAt: Date.now(),
        locale: "en-US",
      });
      expect(root()).toHaveTextContent(/^Saved$/);

      await advance(61_000);
      expect(root()).toHaveTextContent(/^Saved 1 minute ago$/);

      await advance(2 * 60_000);
      expect(root()).toHaveTextContent(/^Saved 3 minutes ago$/);
    });

    it("writes the older time the first time it renders saved", async () => {
      render(SavingStatus, {
        status: "saved",
        savedAt: Date.now() - 5 * 60_000,
        locale: "en-US",
      });
      await advance(0);
      expect(root()).toHaveTextContent(/^Saved 5 minutes ago$/);
    });

    it("writes the time short in the small size", async () => {
      render(SavingStatus, {
        status: "saved",
        savedAt: Date.now() - 5 * 60_000,
        locale: "en-US",
        size: "sm",
      });
      await advance(0);
      expect(root()).toHaveTextContent(/^Saved 5 min\. ago$/);
    });

    it("takes its texts from props", () => {
      render(SavingStatus, {
        status: "error",
        errorText: "Speichern fehlgeschlagen",
        retryText: "Erneut",
      });
      expect(root()).toHaveTextContent("Speichern fehlgeschlagen");
      expect(
        screen.getByRole("button", { name: "Erneut" }),
      ).toBeInTheDocument();
    });
  });

  describe("error", () => {
    it("fires retry and moves focus off the button that leaves", async () => {
      render(SavingStatusRetry);

      const retry = screen.getByRole("button", { name: "Retry" });
      retry.focus();
      await fireEvent.click(retry);

      expect(screen.getByTestId("retries")).toHaveTextContent("1");
      expect(document.activeElement).toBe(root());
    });

    it("shows the error's message in a popover, and none without one", async () => {
      const { rerender } = render(SavingStatus, {
        status: "error",
        error: new Error("Server said 503"),
      });
      const details = screen.getByRole("button", {
        name: "Show error details",
      });
      expect(details).toHaveAttribute("aria-expanded", "false");
      await fireEvent.click(details);
      expect(details).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText("Server said 503")).toBeInTheDocument();

      await rerender({ error: undefined });
      expect(
        screen.queryByRole("button", { name: "Show error details" }),
      ).not.toBeInTheDocument();
    });
  });

  describe("with an autosave", () => {
    it("follows the store, and Retry calls it", async () => {
      let up = false;
      const save = vi.fn(() =>
        up ? Promise.resolve() : Promise.reject(new Error("down")),
      );
      const autosave = createAutosave<string>(save, {
        debounce: 100,
        retry: false,
      });
      render(SavingStatus, { autosave });

      autosave.change("a");
      await advance(0);
      expect(root()).toHaveTextContent("Unsaved changes");

      await advance(100);
      expect(root()).toHaveTextContent("Couldn't save");
      expect(screen.getByRole("button", { name: "Retry" })).toBeVisible();

      up = true;
      await fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      await advance(1000);
      expect(save).toHaveBeenCalledTimes(2);
      expect(root()).toHaveTextContent("Saved");
      autosave.destroy();
    });

    it("shows no spinner for a save that is quick, and no Saved flash", async () => {
      const autosave = createAutosave<string>(
        () => new Promise((resolve) => setTimeout(resolve, 150)),
        { debounce: 100 },
      );
      render(SavingStatus, { autosave });

      const seen = new Set<string>();
      autosave.change("a");
      for (let i = 0; i < 40; i++) {
        await advance(50);
        seen.add(text());
      }
      expect(seen).toContain("Unsaved changes");
      expect([...seen].some((text) => text.includes("Saving"))).toBe(false);
      expect(root()).toHaveTextContent("Saved");
      autosave.destroy();
    });

    it("shows Saving only for a save that is slow, then holds it", async () => {
      let finish = () => {};
      const autosave = createAutosave<string>(
        () => new Promise<void>((resolve) => (finish = resolve)),
        { debounce: 100 },
      );
      render(SavingStatus, { autosave });
      autosave.change("a");
      await advance(100);
      await advance(300);
      expect(root()).not.toHaveTextContent("Saving");
      await advance(100);
      expect(root()).toHaveTextContent("Saving…");

      finish();
      await advance(100);
      // Shown for under 600 ms: it stays.
      expect(root()).toHaveTextContent("Saving…");
      await advance(1000);
      expect(root()).toHaveTextContent("Saved");
      autosave.destroy();
    });

    it("does not flash through 30 seconds of typing with saves in the middle", async () => {
      const autosave = createAutosave<number>(
        () => new Promise((resolve) => setTimeout(resolve, 120)),
        { debounce: 1000, maxWait: 5000 },
      );
      render(SavingStatus, { autosave });

      const texts: string[] = [];
      for (let i = 0; i < 150; i++) {
        autosave.change(i);
        await advance(200);
        const current = text();
        if (texts.at(-1) !== current) texts.push(current);
      }
      // Typing never paused, so the line says one thing all the way.
      expect(texts).toEqual(["Unsaved changes"]);
      autosave.destroy();
    });
  });

  describe("announcements", () => {
    it("is silent for every keystroke and for Saving", async () => {
      const autosave = createAutosave<number>(
        () => new Promise((resolve) => setTimeout(resolve, 120)),
        { debounce: 1000, maxWait: 5000 },
      );
      render(SavingStatus, { autosave });

      for (let i = 0; i < 60; i++) {
        autosave.change(i);
        await advance(200);
        expect(polite()).toHaveTextContent("");
        expect(assertive()).toHaveTextContent("");
      }
      autosave.destroy();
    });

    it("says Saved once, politely, after typing has settled", async () => {
      const autosave = createAutosave<string>(() => Promise.resolve(), {
        debounce: 100,
      });
      render(SavingStatus, { autosave });
      autosave.change("a");
      await advance(100);
      // Shown after its moment, and spoken after a longer one.
      await advance(400);
      expect(root()).toHaveTextContent("Saved");
      expect(polite()).toHaveTextContent("");
      await advance(1500);
      expect(polite()).toHaveTextContent("Saved");
      expect(assertive()).toHaveTextContent("");

      // An edit clears it, so the next Saved is a change a reader hears.
      autosave.change("ab");
      await advance(0);
      expect(polite()).toHaveTextContent("");
      autosave.destroy();
    });

    it("says an error at once, assertively", async () => {
      const autosave = createAutosave<string>(
        () => Promise.reject(new Error("down")),
        { debounce: 100, retry: false },
      );
      render(SavingStatus, { autosave });
      autosave.change("a");
      await advance(100);
      expect(assertive()).toHaveTextContent("Couldn't save");
      expect(polite()).toHaveTextContent("");
      autosave.destroy();
    });

    it("says offline politely", () => {
      const { rerender } = render(SavingStatus, { status: "unsaved" });
      return rerender({ status: "offline" }).then(() => {
        expect(polite()).toHaveTextContent(
          "Offline: changes will save when you reconnect",
        );
      });
    });

    it("says nothing for the status it starts with, or when turned off", async () => {
      const { rerender } = render(SavingStatus, { status: "error" });
      expect(assertive()).toHaveTextContent("");

      await rerender({ announce: false });
      await rerender({ status: "offline" });
      expect(polite()).toHaveTextContent("");
    });
  });

  it("forwards attributes to the root", () => {
    render(SavingStatus, { "data-testid": "x", class: "mine" } as never);
    expect(screen.getByTestId("x")).toHaveClass("bx--saving-status", "mine");
  });
});
