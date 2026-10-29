import { fireEvent, render, screen } from "@testing-library/svelte";
import type { NotificationQueueApi } from "carbon-components-svelte/Notification/notification-queue-context.js";
import { tick } from "svelte";
import Api from "./NotificationQueueApi.test.svelte";
import Outside from "./NotificationQueueApiChild.outside.test.svelte";

type QueueApi = NotificationQueueApi;

function getApi(options: { maxNotifications?: number } = {}) {
  const { component } = render(Api, { props: options });
  return component as unknown as { api: QueueApi };
}

async function flush() {
  await vi.advanceTimersByTimeAsync(0);
  await tick();
}

describe("getNotificationQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("gives a descendant the queue's methods", async () => {
    const { api } = getApi();

    api.add({ kind: "success", title: "Saved" });
    await flush();

    expect(screen.getByText("Saved")).toBeInTheDocument();
  });

  it("throws outside a NotificationQueue", () => {
    expect(() => render(Outside)).toThrow(
      "getNotificationQueue() must be called inside a NotificationQueue",
    );
  });
});

describe("promise", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a spinner in place of the icon while pending", async () => {
    const { api } = getApi();
    api.promise(new Promise(() => {}), { loading: "Saving..." });
    await flush();

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Saving...");
    expect(
      toast.querySelector(".bx--toast-notification__loading"),
    ).toHaveAttribute("aria-hidden", "true");
    expect(
      toast.querySelector(".bx--toast-notification__icon--info"),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Close notification" }),
    ).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(60_000);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("returns the original promise", async () => {
    const { api } = getApi();
    const task = Promise.resolve(1);

    expect(api.promise(task, { loading: "Saving..." })).toBe(task);
    await flush();
  });

  it("turns the loading toast into a success that times out", async () => {
    const { api } = getApi();
    api.promise(Promise.resolve("ok"), {
      loading: "Saving...",
      success: (value) => ({ title: `Saved ${value}`, subtitle: "Done" }),
    });
    await flush();

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("Saved ok");
    expect(toast).toHaveClass("bx--toast-notification--success");
    expect(toast.querySelector(".bx--toast-notification__loading")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Close notification" }),
    ).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(5000);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("turns the loading toast into an error that stays", async () => {
    const { api } = getApi();
    const task = Promise.reject(new Error("offline"));
    api.promise(task, {
      loading: "Saving...",
      error: (reason) => (reason as Error).message,
    });
    await flush();

    const toast = screen.getByRole("status");
    expect(toast).toHaveTextContent("offline");
    expect(toast).toHaveClass("bx--toast-notification--error");

    await vi.advanceTimersByTimeAsync(60_000);
    expect(screen.getByRole("status")).toBeInTheDocument();
    await expect(task).rejects.toThrow("offline");
  });

  it("removes the toast when there is no message for the outcome", async () => {
    const { api } = getApi();
    api.promise(Promise.resolve(), { loading: "Saving..." });
    await flush();

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows a failure again when the loading toast is gone", async () => {
    const { api } = getApi();
    let fail: (reason: unknown) => void = () => {};
    const task = new Promise<void>((_, reject) => {
      fail = reject;
    });
    api.promise(task, { loading: "Saving...", error: "Not saved" });
    await flush();
    api.clear();
    await flush();
    expect(screen.queryByRole("status")).toBeNull();

    fail(new Error("offline"));
    await expect(task).rejects.toThrow();
    await flush();

    expect(screen.getByRole("status")).toHaveTextContent("Not saved");
  });

  it("drops a success when the loading toast is gone", async () => {
    const { api } = getApi();
    let finish: () => void = () => {};
    const task = new Promise<void>((resolve) => {
      finish = resolve;
    });
    api.promise(task, { loading: "Saving...", success: "Saved" });
    await flush();
    api.clear();

    finish();
    await task;
    await flush();

    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("undoable", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function show(options: { maxNotifications?: number } = {}) {
    const { api } = getApi(options);
    const commit = vi.fn();
    const undo = vi.fn();
    const result = api.undoable({ title: "Message deleted", commit, undo });
    await flush();
    return { api, commit, undo, result };
  }

  it("shows a described Undo action and waits", async () => {
    const { commit } = await show();

    const action = screen.getByRole("button", { name: "Undo" });
    expect(action).toHaveAccessibleDescription("Message deleted");
    expect(commit).not.toHaveBeenCalled();
  });

  it("resolves false and skips the commit on Undo", async () => {
    const { commit, undo, result } = await show();

    await fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await flush();

    await expect(result).resolves.toBe(false);
    expect(undo).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).toBeNull();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(commit).not.toHaveBeenCalled();
  });

  it("commits when the timeout passes", async () => {
    const { commit, result } = await show();

    await vi.advanceTimersByTimeAsync(9999);
    expect(commit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await flush();

    await expect(result).resolves.toBe(true);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("commits when the toast is closed", async () => {
    const { commit, result } = await show();

    await fireEvent.click(
      screen.getByRole("button", { name: "Close notification" }),
    );
    await flush();

    await expect(result).resolves.toBe(true);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("commits when a newer toast pushes it out", async () => {
    const { api, commit, result } = await show({ maxNotifications: 1 });

    api.add({ title: "Other" });
    await flush();

    await expect(result).resolves.toBe(true);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("commits on clear and remove", async () => {
    const { api, commit, result } = await show();
    api.clear();
    await expect(result).resolves.toBe(true);
    expect(commit).toHaveBeenCalledTimes(1);

    const second = vi.fn();
    const removed = api.undoable({ id: "x", title: "Moved", commit: second });
    await flush();
    api.remove("x");
    await expect(removed).resolves.toBe(true);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("commits when the queue unmounts", async () => {
    const { component, unmount } = render(Api);
    const { api } = component as unknown as { api: QueueApi };
    const commit = vi.fn();
    const result = api.undoable({ title: "Message deleted", commit });
    await flush();

    unmount();

    await expect(result).resolves.toBe(true);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("commits when the page hides", async () => {
    const { commit, result } = await show();

    window.dispatchEvent(new Event("pagehide"));

    await expect(result).resolves.toBe(true);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("commits once", async () => {
    const { commit } = await show();

    window.dispatchEvent(new Event("pagehide"));
    await vi.advanceTimersByTimeAsync(10_000);

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("rejects with what commit rejects with", async () => {
    const { api } = getApi();
    const result = api.undoable({
      title: "Message deleted",
      commit: () => Promise.reject(new Error("conflict")),
    });
    await flush();

    api.clear();

    await expect(result).rejects.toThrow("conflict");
  });

  it("keeps the toast until closed with timeout 0", async () => {
    const { api } = getApi();
    const commit = vi.fn();
    api.undoable({ title: "Message deleted", commit, timeout: 0 });
    await flush();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(commit).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("commits the toast an id replaces", async () => {
    const { api } = getApi();
    const first = vi.fn();
    const second = vi.fn();
    const one = api.undoable({ id: "same", title: "One", commit: first });
    await flush();

    api.undoable({ id: "same", title: "Two", commit: second });
    await flush();

    await expect(one).resolves.toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it("leaves a plain toast with an action open past its timeout", async () => {
    const { api } = getApi();
    api.add({
      title: "Upload failed",
      timeout: 1000,
      action: { label: "Retry" },
    });
    await flush();

    await vi.advanceTimersByTimeAsync(60_000);

    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
