/* eslint-disable no-await-in-loop -- the clock steps one keystroke at a time */
import { get } from "svelte/store";
import { createAutosave } from "../../src/utils/autosave.js";

/** A save the test settles by hand. */
function deferredSave() {
  const calls: Array<{
    value: string;
    attempt: number;
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];
  const save = vi.fn(
    (value: string, context: { attempt: number }) =>
      new Promise<void>((resolve, reject) => {
        calls.push({ value, attempt: context.attempt, resolve, reject });
      }),
  );
  return { save, calls };
}

// A failing test must not leave timers and window listeners for the next.
const created: Array<{ destroy: () => void }> = [];
function make<T>(...args: Parameters<typeof createAutosave<T>>) {
  const autosave = createAutosave<T>(...args);
  created.push(autosave);
  return autosave;
}

const flushMicrotasks = () => vi.advanceTimersByTimeAsync(0);

function unload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("createAutosave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });

  afterEach(() => {
    for (const autosave of created.splice(0)) autosave.destroy();
    vi.useRealTimers();
  });

  describe("debounce and maxWait", () => {
    it("saves once, with the latest value, after the quiet time", async () => {
      const save = vi.fn();
      const autosave = make<string>(save, { debounce: 500 });

      autosave.change("a");
      await vi.advanceTimersByTimeAsync(300);
      autosave.change("ab");
      await vi.advanceTimersByTimeAsync(300);
      autosave.change("abc");
      expect(save).not.toHaveBeenCalled();
      expect(get(autosave).status).toBe("unsaved");

      await vi.advanceTimersByTimeAsync(500);
      expect(save).toHaveBeenCalledTimes(1);
      expect(save.mock.calls[0][0]).toBe("abc");
      expect(get(autosave).status).toBe("saved");
      autosave.destroy();
    });

    it("saves during typing that never pauses, every maxWait", async () => {
      const save = vi.fn();
      const autosave = make<number>(save, {
        debounce: 1000,
        maxWait: 5000,
      });

      // 30 seconds of a keystroke every 200 ms. A pure debounce never fires.
      const statuses = new Set<string>();
      for (let i = 1; i <= 150; i++) {
        autosave.change(i);
        await vi.advanceTimersByTimeAsync(200);
        statuses.add(get(autosave).status);
      }

      expect(save.mock.calls.length).toBeGreaterThanOrEqual(5);
      expect(save.mock.calls.length).toBeLessThanOrEqual(6);
      // Each save carries the newest value at the time, never a stale one.
      const values = save.mock.calls.map((call) => call[0]);
      expect(values).toEqual([...values].sort((a, b) => a - b));
      expect(statuses.has("error")).toBe(false);
      autosave.destroy();
    });

    it("does not stretch maxWait by the length of a save", async () => {
      const { save, calls } = deferredSave();
      const autosave = make<string>(save, {
        debounce: 1000,
        maxWait: 3000,
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(1000);
      expect(save).toHaveBeenCalledTimes(1);

      // Edits during the save start the clock for the next one.
      await vi.advanceTimersByTimeAsync(400);
      autosave.change("b");
      calls[0].resolve();
      await flushMicrotasks();
      expect(save).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1000);
      expect(save).toHaveBeenCalledTimes(2);
      expect(calls[1].value).toBe("b");
      autosave.destroy();
    });

    it("clamps maxWait to the debounce", async () => {
      const save = vi.fn();
      const autosave = make<string>(save, {
        debounce: 400,
        maxWait: 100,
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(300);
      expect(save).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(100);
      expect(save).toHaveBeenCalledTimes(1);
      autosave.destroy();
    });
  });

  describe("one save at a time", () => {
    it("queues only the latest value behind a save in flight", async () => {
      const { save, calls } = deferredSave();
      const autosave = make<string>(save, { debounce: 100 });

      autosave.change("a");
      await vi.advanceTimersByTimeAsync(100);
      expect(calls.map((call) => call.value)).toEqual(["a"]);

      for (const value of ["b", "c", "d"]) {
        autosave.change(value);
        await vi.advanceTimersByTimeAsync(150);
      }
      // Never two at once, however long the first takes.
      expect(save).toHaveBeenCalledTimes(1);
      expect(get(autosave).status).toBe("saving");

      calls[0].resolve();
      await vi.advanceTimersByTimeAsync(100);
      // "b" and "c" were dropped; the next request carries "d".
      expect(calls.map((call) => call.value)).toEqual(["a", "d"]);
      calls[1].resolve();
      await flushMicrotasks();
      expect(get(autosave).status).toBe("saved");
      autosave.destroy();
    });

    it("is not saved while an edit made during the save is unsent", async () => {
      const { save, calls } = deferredSave();
      const autosave = make<string>(save, { debounce: 100 });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(100);
      autosave.change("b");
      calls[0].resolve();
      await flushMicrotasks();

      const view = get(autosave);
      expect(view.status).toBe("unsaved");
      expect(view.dirty).toBe(true);
      expect(view.savedAt).toBe(Date.now());
      autosave.destroy();
    });

    it("treats a synchronous throw as a failed save", async () => {
      const save = vi.fn(() => {
        throw new Error("boom");
      });
      const autosave = make<string>(save, {
        debounce: 0,
        retry: false,
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(0);
      expect(get(autosave).status).toBe("error");
      expect((get(autosave).error as Error).message).toBe("boom");
      autosave.destroy();
    });
  });

  describe("retry", () => {
    it("fails three times and then succeeds, never showing an error", async () => {
      const outcomes = [false, false, false, true];
      const save = vi.fn(() =>
        outcomes.shift()
          ? Promise.resolve()
          : Promise.reject(new Error("down")),
      );
      const autosave = make<string>(save, {
        debounce: 100,
        retry: { count: 3, delay: 1000, factor: 2 },
      });
      const seen: string[] = [];
      autosave.subscribe((view) => seen.push(view.status));

      autosave.change("a");
      await vi.advanceTimersByTimeAsync(100);
      expect(save).toHaveBeenCalledTimes(1);

      // Backoff: 1 s, then 2 s, then 4 s.
      await vi.advanceTimersByTimeAsync(999);
      expect(save).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(save).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1999);
      expect(save).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(1);
      expect(save).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(3999);
      expect(save).toHaveBeenCalledTimes(3);
      await vi.advanceTimersByTimeAsync(1);
      expect(save).toHaveBeenCalledTimes(4);

      expect(seen).not.toContain("error");
      expect(get(autosave).status).toBe("saved");
      expect(get(autosave).attempts).toBe(0);
      autosave.destroy();
    });

    it("passes the attempt number", async () => {
      const attempts: number[] = [];
      const autosave = make<string>(
        (_value, { attempt }) => {
          attempts.push(attempt);
          return attempt < 3
            ? Promise.reject(new Error("down"))
            : Promise.resolve();
        },
        { debounce: 0, retry: { delay: 10 } },
      );
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(100);
      expect(attempts).toEqual([1, 2, 3]);
      autosave.destroy();
    });

    it("caps the wait at max", async () => {
      const save = vi.fn(() => Promise.reject(new Error("down")));
      const autosave = make<string>(save, {
        debounce: 0,
        retry: { count: 5, delay: 1000, factor: 10, max: 2500 },
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(0);
      await vi.advanceTimersByTimeAsync(1000);
      expect(save).toHaveBeenCalledTimes(2);
      // 10 s would be next; the cap makes it 2.5 s.
      await vi.advanceTimersByTimeAsync(2500);
      expect(save).toHaveBeenCalledTimes(3);
      autosave.destroy();
    });

    it("shows the error when retries run out, and Retry saves", async () => {
      let up = false;
      const save = vi.fn(() =>
        up ? Promise.resolve() : Promise.reject(new Error("down")),
      );
      const autosave = make<string>(save, {
        debounce: 0,
        retry: { count: 2, delay: 100 },
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(10_000);
      expect(save).toHaveBeenCalledTimes(3);
      expect(get(autosave).status).toBe("error");
      expect(get(autosave).attempts).toBe(3);

      // It does not keep trying on its own.
      await vi.advanceTimersByTimeAsync(60_000);
      expect(save).toHaveBeenCalledTimes(3);

      up = true;
      autosave.retry();
      await flushMicrotasks();
      expect(save).toHaveBeenCalledTimes(4);
      expect(get(autosave).status).toBe("saved");
      autosave.destroy();
    });

    it("keeps the error through an edit, and saves the edit", async () => {
      let up = false;
      const save = vi.fn((_value: string) =>
        up ? Promise.resolve() : Promise.reject(new Error("down")),
      );
      const autosave = make<string>(save, {
        debounce: 200,
        retry: false,
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(200);
      expect(get(autosave).status).toBe("error");

      up = true;
      autosave.change("ab");
      expect(get(autosave).status).toBe("error");
      await vi.advanceTimersByTimeAsync(200);
      expect(save).toHaveBeenCalledTimes(2);
      expect(save.mock.calls[1][0]).toBe("ab");
      expect(get(autosave).status).toBe("saved");
      autosave.destroy();
    });

    it("gives up at once when `when` says another try cannot help", async () => {
      const save = vi.fn(() =>
        Promise.reject(Object.assign(new Error("invalid"), { status: 422 })),
      );
      const autosave = make<string>(save, {
        debounce: 0,
        retry: {
          when: (error) => (error as { status?: number }).status !== 422,
        },
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(60_000);
      expect(save).toHaveBeenCalledTimes(1);
      expect(get(autosave).status).toBe("error");
      autosave.destroy();
    });

    it("restarts the chain from an error, so the retries come back", async () => {
      const save = vi.fn(() => Promise.reject(new Error("down")));
      const autosave = make<string>(save, {
        debounce: 100,
        retry: { count: 1, delay: 100 },
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(1000);
      expect(save).toHaveBeenCalledTimes(2);
      expect(get(autosave).status).toBe("error");

      autosave.change("ab");
      await vi.advanceTimersByTimeAsync(1000);
      // One try, then its one retry: the chain did not stop at the first.
      expect(save).toHaveBeenCalledTimes(4);
      autosave.destroy();
    });
  });

  describe("offline", () => {
    it("holds the save while offline and sends it on reconnect", async () => {
      const save = vi.fn(() => Promise.resolve());
      const autosave = make<string>(save, { debounce: 100 });
      autosave.setOnline(false);
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(5000);
      expect(save).not.toHaveBeenCalled();
      expect(get(autosave).status).toBe("offline");

      autosave.setOnline(true);
      await flushMicrotasks();
      expect(save).toHaveBeenCalledTimes(1);
      expect(get(autosave).status).toBe("saved");
      autosave.destroy();
    });

    it("sends the latest value after offline edits", async () => {
      const save = vi.fn((_value: string) => Promise.resolve());
      const autosave = make<string>(save, { debounce: 100 });
      autosave.setOnline(false);
      autosave.change("a");
      autosave.change("ab");
      autosave.change("abc");
      autosave.setOnline(true);
      await flushMicrotasks();
      expect(save).toHaveBeenCalledTimes(1);
      expect(save.mock.calls[0][0]).toBe("abc");
      autosave.destroy();
    });

    it("pauses mid-save without using up a retry, and resumes", async () => {
      const { save, calls } = deferredSave();
      const autosave = make<string>(save, {
        debounce: 100,
        retry: { count: 1, delay: 100 },
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(100);
      expect(calls).toHaveLength(1);

      autosave.setOnline(false);
      calls[0].reject(new Error("network"));
      await vi.advanceTimersByTimeAsync(60_000);
      expect(get(autosave).status).toBe("offline");
      expect(get(autosave).attempts).toBe(0);
      expect(calls).toHaveLength(1);

      autosave.setOnline(true);
      await flushMicrotasks();
      // No backoff after a reconnect, and the attempt count did not move.
      expect(calls).toHaveLength(2);
      expect(calls[1].attempt).toBe(1);
      calls[1].resolve();
      await flushMicrotasks();
      expect(get(autosave).status).toBe("saved");
      autosave.destroy();
    });

    it("does not skip the backoff when it was never offline", async () => {
      const save = vi.fn(() => Promise.reject(new Error("down")));
      const autosave = make<string>(save, {
        debounce: 0,
        retry: { delay: 1000 },
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(0);
      expect(save).toHaveBeenCalledTimes(1);
      autosave.setOnline(true);
      await vi.advanceTimersByTimeAsync(500);
      expect(save).toHaveBeenCalledTimes(1);
      autosave.destroy();
    });

    it("follows the browser's online and offline events", async () => {
      const save = vi.fn(() => Promise.resolve());
      const autosave = make<string>(save, { debounce: 100 });
      autosave.change("a");
      window.dispatchEvent(new Event("offline"));
      await vi.advanceTimersByTimeAsync(1000);
      expect(save).not.toHaveBeenCalled();
      expect(get(autosave).status).toBe("offline");

      window.dispatchEvent(new Event("online"));
      await flushMicrotasks();
      expect(save).toHaveBeenCalledTimes(1);
      autosave.destroy();
    });

    it("reads the network when an edit starts", async () => {
      const onLine = vi
        .spyOn(navigator, "onLine", "get")
        .mockReturnValue(false);
      const save = vi.fn(() => Promise.resolve());
      const autosave = make<string>(save, { debounce: 100 });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(1000);
      expect(get(autosave).status).toBe("offline");
      expect(save).not.toHaveBeenCalled();
      onLine.mockRestore();
    });

    it("ignores the browser's events when `offline` is false", async () => {
      const save = vi.fn(() => Promise.resolve());
      const autosave = make<string>(save, {
        debounce: 100,
        offline: false,
      });
      autosave.change("a");
      window.dispatchEvent(new Event("offline"));
      await vi.advanceTimersByTimeAsync(100);
      expect(save).toHaveBeenCalledTimes(1);
      autosave.destroy();
    });
  });

  describe("beforeunload", () => {
    it("asks only while a value is unsaved or saving", async () => {
      const { save, calls } = deferredSave();
      const autosave = make<string>(save, { debounce: 100 });
      expect(unload()).toBe(false);

      autosave.change("a");
      expect(unload()).toBe(true);

      await vi.advanceTimersByTimeAsync(100);
      expect(get(autosave).status).toBe("saving");
      expect(unload()).toBe(true);

      calls[0].resolve();
      await flushMicrotasks();
      expect(unload()).toBe(false);
      autosave.destroy();
    });

    it("keeps asking after a failure", async () => {
      const save = vi.fn(() => Promise.reject(new Error("down")));
      const autosave = make<string>(save, {
        debounce: 0,
        retry: false,
      });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(0);
      expect(get(autosave).status).toBe("error");
      expect(unload()).toBe(true);
      autosave.destroy();
    });

    it("holds no listener while clean or after destroy", async () => {
      const add = vi.spyOn(window, "addEventListener");
      const remove = vi.spyOn(window, "removeEventListener");
      const autosave = make<string>(() => Promise.resolve(), { debounce: 0 });
      expect(add).not.toHaveBeenCalled();

      autosave.change("a");
      const types = add.mock.calls.map((call) => call[0]);
      expect(types).toEqual(
        expect.arrayContaining(["beforeunload", "online", "offline"]),
      );

      await vi.advanceTimersByTimeAsync(0);
      expect(remove.mock.calls.map((call) => call[0]).sort()).toEqual(
        ["beforeunload", "offline", "online"].sort(),
      );

      autosave.change("b");
      autosave.destroy();
      expect(remove).toHaveBeenCalledTimes(6);
      expect(unload()).toBe(false);
      add.mockRestore();
      remove.mockRestore();
    });

    it("can be turned off", () => {
      const autosave = make<string>(() => Promise.resolve(), {
        beforeUnload: false,
      });
      autosave.change("a");
      expect(unload()).toBe(false);
      autosave.destroy();
    });
  });

  describe("initial", () => {
    it("treats an edit equal to the loaded value as no edit", async () => {
      const save = vi.fn(() => Promise.resolve());
      const autosave = make<{ title: string }>(save, {
        debounce: 100,
        initial: { title: "a" },
      });
      // A reactive `$: autosave.change({ title })` runs once on mount.
      autosave.change({ title: "a" });
      await vi.advanceTimersByTimeAsync(1000);
      expect(get(autosave).status).toBe("idle");
      expect(save).not.toHaveBeenCalled();
      expect(unload()).toBe(false);
    });

    it("compares with the last saved value, and keeps a pending edit", async () => {
      const save = vi.fn((_value: { title: string }) => Promise.resolve());
      const autosave = make<{ title: string }>(save, {
        debounce: 100,
        initial: { title: "a" },
      });
      autosave.change({ title: "ab" });
      // Typed back while the first edit still waits: it still has to save.
      autosave.change({ title: "a" });
      await vi.advanceTimersByTimeAsync(100);
      expect(save).toHaveBeenCalledTimes(1);
      expect(save.mock.calls[0][0]).toEqual({ title: "a" });

      // Saved is now the baseline, so the same value again is no edit.
      autosave.change({ title: "a" });
      await vi.advanceTimersByTimeAsync(1000);
      expect(save).toHaveBeenCalledTimes(1);
      expect(get(autosave).status).toBe("saved");
    });

    it("takes the baseline from reset(loaded)", async () => {
      const save = vi.fn(() => Promise.resolve());
      const autosave = make<string>(save, { debounce: 100 });
      autosave.reset("loaded");
      autosave.change("loaded");
      await vi.advanceTimersByTimeAsync(1000);
      expect(save).not.toHaveBeenCalled();
      autosave.change("edited");
      await vi.advanceTimersByTimeAsync(100);
      expect(save).toHaveBeenCalledTimes(1);
    });
  });

  describe("flush, reset and destroy", () => {
    it("flush saves now and resolves true", async () => {
      const save = vi.fn(() => Promise.resolve());
      const autosave = make<string>(save, { debounce: 10_000 });
      autosave.change("a");
      const done = autosave.flush();
      await vi.advanceTimersByTimeAsync(0);
      await expect(done).resolves.toBe(true);
      expect(save).toHaveBeenCalledTimes(1);
      autosave.destroy();
    });

    it("flush waits for a save in flight and then saves the newer value", async () => {
      const { save, calls } = deferredSave();
      const autosave = make<string>(save, { debounce: 100 });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(100);
      autosave.change("b");

      const done = autosave.flush();
      calls[0].resolve();
      await flushMicrotasks();
      expect(calls.map((call) => call.value)).toEqual(["a", "b"]);
      calls[1].resolve();
      await expect(done).resolves.toBe(true);
      autosave.destroy();
    });

    it("flush resolves false on a failure and when offline", async () => {
      const save = vi.fn(() => Promise.reject(new Error("down")));
      const autosave = make<string>(save, { debounce: 0 });
      autosave.change("a");
      const failed = autosave.flush();
      await vi.advanceTimersByTimeAsync(0);
      await expect(failed).resolves.toBe(false);

      autosave.setOnline(false);
      await expect(autosave.flush()).resolves.toBe(false);
      autosave.destroy();
    });

    it("flush resolves true when nothing is unsaved", async () => {
      const autosave = make<string>(() => Promise.resolve());
      await expect(autosave.flush()).resolves.toBe(true);
      autosave.destroy();
    });

    it("reset ignores the result of a save in flight", async () => {
      const { save, calls } = deferredSave();
      const autosave = make<string>(save, { debounce: 100 });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(100);
      autosave.reset();
      expect(get(autosave).status).toBe("idle");

      calls[0].resolve();
      await flushMicrotasks();
      // The load took the value as the baseline: the late result is not a save.
      expect(get(autosave).status).toBe("idle");
      expect(get(autosave).savedAt).toBeUndefined();
      autosave.destroy();
    });

    it("destroy stops the timers and ignores late results", async () => {
      const { save, calls } = deferredSave();
      const autosave = make<string>(save, { debounce: 100 });
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(100);
      autosave.change("b");
      autosave.destroy();
      expect(vi.getTimerCount()).toBe(0);

      calls[0].resolve();
      await vi.advanceTimersByTimeAsync(10_000);
      expect(save).toHaveBeenCalledTimes(1);
      autosave.change("c");
      expect(vi.getTimerCount()).toBe(0);
    });

    it("aborts the signal on destroy", async () => {
      let signal: AbortSignal | undefined;
      const autosave = make<string>(
        (_value, context) => {
          signal = context.signal;
          return new Promise(() => {});
        },
        { debounce: 0 },
      );
      autosave.change("a");
      await vi.advanceTimersByTimeAsync(0);
      expect(signal?.aborted).toBe(false);
      autosave.destroy();
      expect(signal?.aborted).toBe(true);
    });
  });
});
