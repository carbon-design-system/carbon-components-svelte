import { get } from "svelte/store";
import { createUnsavedChanges } from "../../src/UnsavedChanges/unsaved-changes.js";
import { netListenerCalls } from "../utils/net-listener-calls";

function dispatchUnload() {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event;
}

describe("createUnsavedChanges", () => {
  it("counts dirty sources and emits only when the count changes", () => {
    const store = createUnsavedChanges();
    const counts: number[] = [];
    const unsubscribe = store.count.subscribe((count) => counts.push(count));

    store.set("a", true);
    store.set("a", true);
    store.set("b", true);
    store.set("a", false);
    store.clear("b");

    expect(counts).toEqual([0, 1, 2, 1, 0]);
    expect(get(store.dirty)).toBe(false);
    unsubscribe();
  });

  describe("beforeunload", () => {
    it("listens only while dirty", () => {
      const add = vi.spyOn(window, "addEventListener");
      const remove = vi.spyOn(window, "removeEventListener");
      const store = createUnsavedChanges();

      expect(netListenerCalls(add, remove, "beforeunload")).toBe(0);
      store.set("a", true);
      store.set("b", true);
      expect(netListenerCalls(add, remove, "beforeunload")).toBe(1);
      store.reset();
      expect(netListenerCalls(add, remove, "beforeunload")).toBe(0);
    });

    it("cancels the unload while dirty and not when clean", () => {
      const store = createUnsavedChanges();

      expect(dispatchUnload().defaultPrevented).toBe(false);
      store.set("a", true);
      expect(dispatchUnload().defaultPrevented).toBe(true);
      store.clear("a");
      expect(dispatchUnload().defaultPrevented).toBe(false);
    });

    it("is off with the option and toggles at runtime", () => {
      const store = createUnsavedChanges({ beforeUnload: false });
      store.set("a", true);
      expect(dispatchUnload().defaultPrevented).toBe(false);

      store.setBeforeUnload(true);
      expect(dispatchUnload().defaultPrevented).toBe(true);
      store.setBeforeUnload(false);
      expect(dispatchUnload().defaultPrevented).toBe(false);
      store.reset();
    });

    it("stays quiet while an ignore predicate holds", () => {
      const store = createUnsavedChanges();
      let navigating = true;
      store.ignoreUnload(() => navigating);
      store.set("a", true);

      expect(dispatchUnload().defaultPrevented).toBe(false);
      navigating = false;
      expect(dispatchUnload().defaultPrevented).toBe(true);
      store.reset();
    });
  });

  describe("guard", () => {
    it("resolves true without asking when clean", async () => {
      const store = createUnsavedChanges();
      const ask = vi.fn(() => false);

      expect(await store.guard(ask)).toBe(true);
      expect(ask).not.toHaveBeenCalled();
    });

    it("keeps the changes when the user declines", async () => {
      const store = createUnsavedChanges();
      store.set("a", true);

      expect(await store.guard(() => false)).toBe(false);
      expect(get(store.dirty)).toBe(true);
    });

    it("clears the changes when the user approves", async () => {
      const store = createUnsavedChanges();
      store.set("a", true);

      expect(await store.guard(async () => true)).toBe(true);
      expect(get(store.dirty)).toBe(false);
    });

    it("shares one answer between concurrent calls", async () => {
      const store = createUnsavedChanges();
      store.set("a", true);
      const ask = vi.fn(() => true);

      const results = await Promise.all([store.guard(ask), store.guard(ask)]);
      expect(results).toEqual([true, true]);
      expect(ask).toHaveBeenCalledTimes(1);
    });

    it("asks again after a failed ask, which keeps the changes", async () => {
      const store = createUnsavedChanges();
      store.set("a", true);

      await expect(
        store.guard(() => Promise.reject(new Error("boom"))),
      ).rejects.toThrow("boom");
      expect(get(store.dirty)).toBe(true);
      expect(await store.guard(() => true)).toBe(true);
    });

    it("falls back to window.confirm", async () => {
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
      const store = createUnsavedChanges();
      store.set("a", true);

      expect(await store.guard()).toBe(false);
      expect(confirm).toHaveBeenCalledTimes(1);
      confirm.mockRestore();
    });
  });

  describe("interrupt", () => {
    it("returns false and does nothing when clean", () => {
      const store = createUnsavedChanges();
      const cancel = vi.fn();
      const retry = vi.fn();

      expect(store.interrupt(cancel, retry)).toBe(false);
      expect(cancel).not.toHaveBeenCalled();
      expect(retry).not.toHaveBeenCalled();
    });

    it("cancels synchronously and retries only on approval", async () => {
      const store = createUnsavedChanges();
      store.set("a", true);
      const calls: string[] = [];
      vi.spyOn(window, "confirm").mockReturnValue(true);

      const interrupted = store.interrupt(
        () => calls.push("cancel"),
        () => calls.push("retry"),
      );
      // `cancel()` must already have run: a router commits as soon as its
      // hook returns.
      expect(interrupted).toBe(true);
      expect(calls).toEqual(["cancel"]);

      await new Promise((resolve) => setTimeout(resolve));
      expect(calls).toEqual(["cancel", "retry"]);
    });

    it("does not retry when the user keeps editing", async () => {
      const store = createUnsavedChanges();
      store.set("a", true);
      const retry = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(false);

      store.interrupt(() => {}, retry);
      await new Promise((resolve) => setTimeout(resolve));
      expect(retry).not.toHaveBeenCalled();
      expect(get(store.dirty)).toBe(true);
    });

    it("retries only the latest target when interrupted twice", async () => {
      const store = createUnsavedChanges();
      store.set("a", true);
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const first = vi.fn();
      const second = vi.fn();

      store.interrupt(() => {}, first);
      store.interrupt(() => {}, second);
      await new Promise((resolve) => setTimeout(resolve));

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });
  });

  describe("router recipe", () => {
    // SvelteKit commits a navigation as soon as `beforeNavigate` returns
    // unless `cancel()` ran synchronously, so a hook that awaits first loses.
    function createRouter(
      hook: (nav: { cancel: () => void; to: string }) => void,
    ) {
      const visited: string[] = [];
      function navigate(to: string) {
        let canceled = false;
        hook({ cancel: () => (canceled = true), to });
        if (!canceled) visited.push(to);
      }
      return { navigate, visited };
    }

    it("blocks the navigation until the user discards", async () => {
      const store = createUnsavedChanges();
      store.set("form", true);
      vi.spyOn(window, "confirm").mockReturnValue(true);
      const router = createRouter(({ cancel, to }) => {
        store.interrupt(cancel, () => router.navigate(to));
      });

      router.navigate("/next");
      expect(router.visited).toEqual([]);
      await new Promise((resolve) => setTimeout(resolve));
      expect(router.visited).toEqual(["/next"]);
    });
  });

  describe("closeGuard", () => {
    function closeEvent(trigger: string) {
      return new CustomEvent("close", {
        cancelable: true,
        detail: { trigger },
      });
    }

    it("lets a clean dialog close itself", () => {
      const store = createUnsavedChanges();
      const close = vi.fn();
      const event = closeEvent("escape-key");

      store.closeGuard(close)(event);
      expect(event.defaultPrevented).toBe(false);
      expect(close).not.toHaveBeenCalled();
    });

    it("closes from a button handler when clean", () => {
      const store = createUnsavedChanges();
      const close = vi.fn();

      store.closeGuard(close)();
      expect(close).toHaveBeenCalledTimes(1);
    });

    it("ignores a programmatic close even when dirty", () => {
      const store = createUnsavedChanges();
      store.set("a", true);
      const event = closeEvent("programmatic");
      event.preventDefault();
      const close = vi.fn();

      store.closeGuard(close)(event);
      expect(close).not.toHaveBeenCalled();
      expect(get(store.dirty)).toBe(true);
    });

    it("cancels a dirty close and closes only after approval", async () => {
      const store = createUnsavedChanges();
      store.set("a", true);
      const close = vi.fn();
      const event = closeEvent("escape-key");
      const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);

      store.closeGuard(close)(event);
      expect(event.defaultPrevented).toBe(true);
      await new Promise((resolve) => setTimeout(resolve));
      expect(close).not.toHaveBeenCalled();

      confirm.mockReturnValue(true);
      store.closeGuard(close)(closeEvent("close-button"));
      await new Promise((resolve) => setTimeout(resolve));
      expect(close).toHaveBeenCalledTimes(1);
    });
  });

  describe("markSaved", () => {
    it("clears every source and tells listeners", () => {
      const store = createUnsavedChanges();
      const listener = vi.fn();
      const off = store.onSaved(listener);
      store.set("a", true);

      store.markSaved();
      expect(get(store.dirty)).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);

      off();
      store.markSaved();
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("prompt", () => {
    it("answers guard() through the mounted prompt", async () => {
      const store = createUnsavedChanges();
      const unmount = store.mountPrompt();
      store.set("a", true);

      const decision = store.guard();
      const request = get(store.prompt);
      assert(request);
      request.resolve(true);

      expect(await decision).toBe(true);
      expect(get(store.prompt)).toBeNull();
      unmount?.();
    });

    it("attaches one prompt per store", () => {
      const store = createUnsavedChanges();
      const unmount = store.mountPrompt();

      expect(unmount).toBeTypeOf("function");
      expect(store.mountPrompt()).toBeNull();
      unmount?.();
      expect(store.mountPrompt()).toBeTypeOf("function");
    });

    it("declines a pending request when the prompt unmounts", async () => {
      const store = createUnsavedChanges();
      const unmount = store.mountPrompt();
      store.set("a", true);

      const decision = store.guard();
      unmount?.();
      expect(await decision).toBe(false);
    });
  });
});
