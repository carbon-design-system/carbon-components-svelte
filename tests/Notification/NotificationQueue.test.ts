import { fireEvent, render, screen } from "@testing-library/svelte";
import type NotificationButtonComponent from "carbon-components-svelte/Notification/NotificationButton.svelte";
import type NotificationQueueComponent from "carbon-components-svelte/Notification/NotificationQueue.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import NotificationQueueTest from "./NotificationQueue.test.svelte";

function getQueue(
  queue: NotificationQueueComponent | undefined,
): NotificationQueueComponent {
  assert(queue);
  return queue;
}

describe("NotificationQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render an empty live region before any notification is added", () => {
    render(NotificationQueueTest);

    const queueContainer = document.querySelector(".bx--notification-queue");
    expect(queueContainer).toBeInTheDocument();
    expect(queueContainer).toHaveAttribute("aria-live", "polite");
    expect(queueContainer?.children).toHaveLength(0);
  });

  it("should render queued toasts without their own live role", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({ kind: "error", title: "Failed" });
    getQueue(component.queue).add({ kind: "success", title: "Saved" });
    await tick();

    const toasts = document.querySelectorAll(".bx--toast-notification");
    expect(toasts).toHaveLength(2);
    for (const toast of toasts) {
      expect(toast).not.toHaveAttribute("role");
    }
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should keep an explicit role on a queued toast", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({ kind: "error", title: "Failed", role: "alert" });
    await tick();

    expect(screen.getByRole("alert")).toHaveTextContent("Failed");
  });

  it("should render with default props", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      kind: "success",
      title: "Test notification",
    });
    await tick();

    const queueContainer = document.querySelector('[style*="position: fixed"]');
    expect(queueContainer).toBeInTheDocument();
    expectInlineStyle(queueContainer, {
      position: "fixed",
      right: "1rem",
      top: "3rem",
      "z-index": "9000",
    });
  });

  it("should add a notification", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({
      kind: "success",
      title: "Success notification",
      subtitle: "Your changes have been saved.",
    });
    await tick();

    expect(id).toBeTruthy();
    expect(screen.getByText("Success notification")).toBeInTheDocument();
    expect(
      screen.getByText("Your changes have been saved."),
    ).toBeInTheDocument();
  });

  it("should generate unique ids when id is not provided", async () => {
    const { component } = render(NotificationQueueTest);

    const id1 = getQueue(component.queue).add({
      kind: "info",
      title: "Notification 1",
    });
    await tick();

    const id2 = getQueue(component.queue).add({
      kind: "info",
      title: "Notification 2",
    });
    await tick();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^notification-\d+$/);
    expect(id2).toMatch(/^notification-\d+$/);
  });

  it("should use provided id", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({
      id: "custom-id",
      kind: "warning",
      title: "Custom ID notification",
    });
    await tick();

    expect(id).toBe("custom-id");
  });

  it("should deduplicate notifications by id", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({
      id: "duplicate-id",
      kind: "error",
      title: "First notification",
    });

    const id2 = getQueue(component.queue).add({
      id: "duplicate-id",
      kind: "error",
      title: "Second notification",
    });
    await tick();

    expect(id).toBe("duplicate-id");
    expect(id2).toBe("duplicate-id");

    const notifications = document.querySelectorAll(".bx--toast-notification");
    expect(notifications).toHaveLength(1);
    expect(screen.getByText("First notification")).toBeInTheDocument();
    expect(screen.queryByText("Second notification")).not.toBeInTheDocument();
  });

  it("should add multiple notifications", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      kind: "success",
      title: "First notification",
    });
    await tick();

    getQueue(component.queue).add({
      kind: "info",
      title: "Second notification",
    });
    await tick();

    getQueue(component.queue).add({
      kind: "warning",
      title: "Third notification",
    });
    await tick();

    expect(screen.getByText("First notification")).toBeInTheDocument();
    expect(screen.getByText("Second notification")).toBeInTheDocument();
    expect(screen.getByText("Third notification")).toBeInTheDocument();
  });

  it("should remove a notification by id", async () => {
    const { component } = render(NotificationQueueTest);

    const id1 = getQueue(component.queue).add({
      kind: "success",
      title: "First notification",
    });
    await tick();

    getQueue(component.queue).add({
      kind: "info",
      title: "Second notification",
    });
    await tick();

    expect(screen.getByText("First notification")).toBeInTheDocument();
    expect(screen.getByText("Second notification")).toBeInTheDocument();

    const removed = getQueue(component.queue).remove(id1);
    await tick();
    expect(removed).toBe(true);

    expect(screen.queryByText("First notification")).not.toBeInTheDocument();
    expect(screen.getByText("Second notification")).toBeInTheDocument();
  });

  it("should return false when removing non-existent notification", () => {
    const { component } = render(NotificationQueueTest);

    const removed = getQueue(component.queue).remove("non-existent-id");
    expect(removed).toBe(false);
  });

  it("should update an existing notification in place", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({
      id: "progress",
      kind: "info",
      title: "Uploading...",
      subtitle: "0%",
    });
    await tick();

    expect(screen.getByText("Uploading...")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();

    const updated = getQueue(component.queue).update(id, {
      kind: "success",
      title: "Upload complete",
      subtitle: "100%",
    });
    await tick();

    expect(updated).toBe(true);
    expect(screen.queryByText("Uploading...")).not.toBeInTheDocument();
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.getByText("Upload complete")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(document.querySelectorAll(".bx--toast-notification")).toHaveLength(
      1,
    );
  });

  it("should merge patch into existing notification on update", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({
      id: "merge",
      kind: "info",
      title: "Title",
      subtitle: "Subtitle",
    });
    await tick();

    getQueue(component.queue).update(id, { kind: "success" });
    await tick();

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("should ignore id changes on update", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({
      id: "original",
      kind: "info",
      title: "Original",
    });
    await tick();

    const updated = getQueue(component.queue).update(id, {
      id: "different",
      title: "Updated",
    });
    await tick();

    expect(updated).toBe(true);
    expect(screen.getByText("Updated")).toBeInTheDocument();

    const removed = getQueue(component.queue).remove("original");
    await tick();
    expect(removed).toBe(true);
    expect(screen.queryByText("Updated")).not.toBeInTheDocument();
  });

  it("should return false when updating non-existent notification", () => {
    const { component } = render(NotificationQueueTest);

    const updated = getQueue(component.queue).update("non-existent-id", {
      title: "New title",
    });
    expect(updated).toBe(false);
  });

  it("should clear all notifications", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      kind: "success",
      title: "First notification",
    });
    await tick();

    getQueue(component.queue).add({
      kind: "info",
      title: "Second notification",
    });
    await tick();

    expect(screen.getByText("First notification")).toBeInTheDocument();
    expect(screen.getByText("Second notification")).toBeInTheDocument();

    getQueue(component.queue).clear();
    await tick();

    expect(screen.queryByText("First notification")).not.toBeInTheDocument();
    expect(screen.queryByText("Second notification")).not.toBeInTheDocument();
  });

  it("should restart the timeout when update sets restartTimeout", async () => {
    const { component } = render(NotificationQueueTest);
    const queue = getQueue(component.queue);

    queue.add({ id: "a", title: "Saving", timeout: 1000 });
    await tick();

    vi.advanceTimersByTime(800);
    queue.update("a", { title: "Saved", restartTimeout: true });
    await tick();

    vi.advanceTimersByTime(800);
    await tick();
    expect(screen.getByText("Saved")).toBeInTheDocument();

    vi.advanceTimersByTime(200);
    await tick();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("should keep the original timeout when update omits restartTimeout", async () => {
    const { component } = render(NotificationQueueTest);
    const queue = getQueue(component.queue);

    queue.add({ id: "a", title: "Saving", timeout: 1000 });
    await tick();

    vi.advanceTimersByTime(800);
    queue.update("a", { title: "Saved" });
    await tick();

    vi.advanceTimersByTime(200);
    await tick();
    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
  });

  it("should not include timeoutKey in the dismiss payload", async () => {
    const ondismiss = vi.fn();
    const { component } = render(NotificationQueueTest, {
      props: { ondismiss },
    });
    const queue = getQueue(component.queue);

    queue.add({ id: "a", title: "Saving" });
    queue.update("a", { restartTimeout: true });
    queue.remove("a");
    await tick();

    expect(ondismiss.mock.calls[0][0].detail.notification).toEqual({
      id: "a",
      title: "Saving",
    });
  });

  it("should not render restartTimeout as an attribute", async () => {
    const { component } = render(NotificationQueueTest);
    const queue = getQueue(component.queue);

    queue.add({ id: "a", title: "Saving" });
    queue.update("a", { restartTimeout: true });
    await tick();

    const toast = document.querySelector(".bx--toast-notification");
    expect(toast).not.toHaveAttribute("restartTimeout");
    expect(toast).not.toHaveAttribute("timeoutKey");
  });

  describe("collapseDuplicates", () => {
    it("should stack identical notifications by default", async () => {
      const { component } = render(NotificationQueueTest);
      const queue = getQueue(component.queue);

      queue.add({ kind: "success", title: "Saved" });
      queue.add({ kind: "success", title: "Saved" });
      await tick();

      expect(screen.getAllByText("Saved")).toHaveLength(2);
    });

    it("should collapse identical notifications into one row with a count", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { collapseDuplicates: true },
      });
      const queue = getQueue(component.queue);

      const first = queue.add({ kind: "success", title: "Saved" });
      const second = queue.add({ kind: "success", title: "Saved" });
      await tick();

      expect(second).toBe(first);
      expect(document.querySelectorAll(".bx--toast-notification")).toHaveLength(
        1,
      );
      expect(screen.getByText("Saved (2)")).toBeInTheDocument();

      queue.add({ kind: "success", title: "Saved" });
      await tick();
      expect(screen.getByText("Saved (3)")).toBeInTheDocument();
    });

    it("should not collapse notifications with a different kind or subtitle", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { collapseDuplicates: true },
      });
      const queue = getQueue(component.queue);

      queue.add({ kind: "success", title: "Saved" });
      queue.add({ kind: "info", title: "Saved" });
      queue.add({ kind: "success", title: "Saved", subtitle: "Draft" });
      await tick();

      expect(screen.getAllByText("Saved")).toHaveLength(3);
    });

    it("should still ignore a repeated id without counting it", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { collapseDuplicates: true },
      });
      const queue = getQueue(component.queue);

      queue.add({ id: "a", title: "Saved" });
      queue.add({ id: "a", title: "Saved" });
      await tick();

      expect(screen.getByText("Saved")).toBeInTheDocument();
      expect(screen.queryByText("Saved (2)")).not.toBeInTheDocument();
    });

    it("should restart the timeout when a duplicate is collapsed", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { collapseDuplicates: true },
      });
      const queue = getQueue(component.queue);

      queue.add({ title: "Retrying", timeout: 1000 });
      await tick();
      vi.advanceTimersByTime(800);

      queue.add({ title: "Retrying", timeout: 1000 });
      await tick();
      vi.advanceTimersByTime(800);
      await tick();
      expect(screen.getByText("Retrying (2)")).toBeInTheDocument();

      vi.advanceTimersByTime(200);
      await tick();
      expect(screen.queryByText("Retrying (2)")).not.toBeInTheDocument();
    });

    it("should not include count in the dismiss payload", async () => {
      const ondismiss = vi.fn();
      const { component } = render(NotificationQueueTest, {
        props: { collapseDuplicates: true, ondismiss },
      });
      const queue = getQueue(component.queue);

      const id = queue.add({ title: "Saved" });
      queue.add({ title: "Saved" });
      queue.remove(id);
      await tick();

      expect(ondismiss.mock.calls[0][0].detail.notification).not.toHaveProperty(
        "count",
      );
    });

    it("should not render count as an attribute", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { collapseDuplicates: true },
      });
      const queue = getQueue(component.queue);

      queue.add({ title: "Saved" });
      queue.add({ title: "Saved" });
      await tick();

      const toast = document.querySelector(".bx--toast-notification");
      expect(toast).not.toHaveAttribute("count");
    });
  });

  describe("history", () => {
    const getHistory = (component: Record<string, unknown>) =>
      component.history as ComponentProps<NotificationQueueComponent>["history"];

    it("should keep no history by default", async () => {
      vi.useRealTimers();
      const { component } = render(NotificationQueueTest);

      getQueue(component.queue).add({ id: "a", title: "First" });
      await tick();
      await user.click(screen.getByLabelText("Close notification"));
      await tick();

      expect(getHistory(component)).toEqual([]);
    });

    it("should keep the newest dismissed notifications up to maxHistory", async () => {
      vi.setSystemTime(1000);
      const { component } = render(NotificationQueueTest, {
        props: { maxHistory: 2 },
      });
      const queue = getQueue(component.queue);

      for (const id of ["a", "b", "c"]) queue.add({ id, title: id });
      for (const id of ["a", "b", "c"]) queue.remove(id);
      await tick();

      const history = getHistory(component);
      expect(history?.map((n) => n.id)).toEqual(["c", "b"]);
      expect(history?.[0]).toEqual({ id: "c", title: "c", dismissedAt: 1000 });
    });

    it("should record a toast closed by its close button or timeout", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { maxHistory: 5 },
      });
      const queue = getQueue(component.queue);

      queue.add({ id: "timed", title: "Timed", timeout: 1000 });
      await tick();
      vi.advanceTimersByTime(1000);
      await tick();

      expect(getHistory(component)?.map((n) => n.id)).toEqual(["timed"]);
    });

    it("should not record a toast whose close was cancelled", async () => {
      vi.useRealTimers();
      const { component } = render(NotificationQueueTest, {
        props: {
          maxHistory: 5,
          onclose: (event: CustomEvent) => event.preventDefault(),
        },
      });

      getQueue(component.queue).add({ id: "a", title: "Sticky" });
      await tick();
      await user.click(screen.getByLabelText("Close notification"));
      await tick();

      expect(getHistory(component)).toEqual([]);
    });

    it("should record notifications dropped by maxNotifications", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { maxHistory: 5, maxNotifications: 1 },
      });
      const queue = getQueue(component.queue);

      queue.add({ id: "a", title: "First" });
      queue.add({ id: "b", title: "Second" });
      await tick();

      expect(getHistory(component)?.map((n) => n.id)).toEqual(["a"]);
    });

    it("should move cleared notifications into history, newest first", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { maxHistory: 5, position: "bottom-right" },
      });
      const queue = getQueue(component.queue);

      queue.add({ id: "a", title: "First" });
      queue.add({ id: "b", title: "Second" });
      queue.clear();
      await tick();

      expect(getHistory(component)?.map((n) => n.id)).toEqual(["b", "a"]);
      expect(document.querySelectorAll(".bx--toast-notification")).toHaveLength(
        0,
      );
    });

    it("should not store internal fields in history", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { maxHistory: 5, collapseDuplicates: true },
      });
      const queue = getQueue(component.queue);

      queue.add({ id: "a", title: "Saved" });
      queue.add({ title: "Saved" });
      queue.update("a", { restartTimeout: true });
      queue.remove("a");
      await tick();

      const [entry] = getHistory(component) ?? [];
      expect(entry).not.toHaveProperty("count");
      expect(entry).not.toHaveProperty("timeoutKey");
    });

    it("should empty history with clearHistory and trim it when maxHistory shrinks", async () => {
      const { component, rerender } = render(NotificationQueueTest, {
        props: { maxHistory: 3 },
      });
      const queue = getQueue(component.queue);

      for (const id of ["a", "b", "c"]) queue.add({ id, title: id });
      queue.clear();
      await tick();
      expect(getHistory(component)).toHaveLength(3);

      await rerender({ maxHistory: 1 });
      expect(getHistory(component)).toHaveLength(1);

      queue.clearHistory();
      await tick();
      expect(getHistory(component)).toEqual([]);
      expect(screen.queryByText("a")).not.toBeInTheDocument();
    });
  });

  it("should limit notifications to maxNotifications (top-right)", async () => {
    const { component } = render(NotificationQueueTest, {
      props: { maxNotifications: 2 },
    });

    getQueue(component.queue).add({
      kind: "success",
      title: "First",
    });
    await tick();

    getQueue(component.queue).add({
      kind: "info",
      title: "Second",
    });
    await tick();

    getQueue(component.queue).add({
      kind: "warning",
      title: "Third",
    });
    await tick();

    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  describe("close and dismiss events", () => {
    it("should dispatch close and dismiss when the close button is clicked", async () => {
      vi.useRealTimers();
      const onclose = vi.fn();
      const ondismiss = vi.fn();
      const { component } = render(NotificationQueueTest, {
        props: { onclose, ondismiss },
      });

      getQueue(component.queue).add({ id: "a", title: "Closable" });
      await tick();

      await user.click(screen.getByLabelText("Close notification"));
      await tick();

      expect(onclose).toHaveBeenCalledTimes(1);
      expect(onclose.mock.calls[0][0].detail).toEqual({
        id: "a",
        timeout: false,
        trigger: "close-button",
      });
      expect(ondismiss).toHaveBeenCalledTimes(1);
      expect(ondismiss.mock.calls[0][0].detail).toEqual({
        notification: { id: "a", title: "Closable" },
        trigger: "close-button",
      });
      expect(screen.queryByText("Closable")).not.toBeInTheDocument();
    });

    it("should keep the toast and skip dismiss when close is cancelled", async () => {
      vi.useRealTimers();
      const ondismiss = vi.fn();
      const { component } = render(NotificationQueueTest, {
        props: {
          onclose: (event: CustomEvent) => event.preventDefault(),
          ondismiss,
        },
      });

      getQueue(component.queue).add({ id: "a", title: "Sticky" });
      await tick();

      await user.click(screen.getByLabelText("Close notification"));
      await tick();

      expect(screen.getByText("Sticky")).toBeInTheDocument();
      expect(ondismiss).not.toHaveBeenCalled();
      expect(getQueue(component.queue).remove("a")).toBe(true);
    });

    it("should dispatch close and dismiss with the timeout trigger", async () => {
      const onclose = vi.fn();
      const ondismiss = vi.fn();
      const { component } = render(NotificationQueueTest, {
        props: { onclose, ondismiss },
      });

      getQueue(component.queue).add({ id: "a", title: "Timed", timeout: 1000 });
      await tick();

      vi.advanceTimersByTime(1000);
      await tick();

      expect(onclose.mock.calls[0][0].detail).toEqual({
        id: "a",
        timeout: true,
        trigger: "timeout",
      });
      expect(ondismiss.mock.calls[0][0].detail.trigger).toBe("timeout");
      expect(screen.queryByText("Timed")).not.toBeInTheDocument();
    });

    it("should report the escape-key trigger", async () => {
      const onclose = vi.fn();
      const ondismiss = vi.fn();
      const { component } = render(NotificationQueueTest, {
        props: { onclose, ondismiss },
      });

      getQueue(component.queue).add({ id: "a", title: "Escapable" });
      await tick();

      const closeButton = screen.getByLabelText("Close notification");
      closeButton.focus();
      await fireEvent.keyDown(closeButton, { key: "Escape" });

      expect(onclose.mock.calls[0][0].detail.trigger).toBe("escape-key");
      expect(ondismiss.mock.calls[0][0].detail.trigger).toBe("escape-key");
    });

    it("should dispatch dismiss with the overflow trigger for the dropped row", async () => {
      const ondismiss = vi.fn();
      const { component } = render(NotificationQueueTest, {
        props: { maxNotifications: 1, ondismiss },
      });

      getQueue(component.queue).add({ id: "first", title: "First" });
      await tick();
      expect(ondismiss).not.toHaveBeenCalled();

      getQueue(component.queue).add({ id: "second", title: "Second" });
      await tick();

      expect(ondismiss).toHaveBeenCalledTimes(1);
      expect(ondismiss.mock.calls[0][0].detail).toEqual({
        notification: { id: "first", title: "First" },
        trigger: "overflow",
      });
      expect(screen.getByText("Second")).toBeInTheDocument();
    });

    it("should drop the oldest row at bottom positions", async () => {
      const ondismiss = vi.fn();
      const { component } = render(NotificationQueueTest, {
        props: { position: "bottom-right", maxNotifications: 1, ondismiss },
      });

      getQueue(component.queue).add({ id: "first", title: "First" });
      getQueue(component.queue).add({ id: "second", title: "Second" });
      await tick();

      expect(ondismiss.mock.calls[0][0].detail.notification.id).toBe("first");
    });

    it("should dispatch dismiss with the programmatic trigger for remove and clear", async () => {
      const ondismiss = vi.fn();
      const { component } = render(NotificationQueueTest, {
        props: { ondismiss },
      });
      const queue = getQueue(component.queue);

      queue.add({ id: "a", title: "A" });
      queue.add({ id: "b", title: "B" });
      queue.add({ id: "c", title: "C" });
      queue.remove("a");
      queue.remove("missing");
      queue.clear();
      await tick();

      expect(
        ondismiss.mock.calls.map(([event]) => [
          event.detail.notification.id,
          event.detail.trigger,
        ]),
      ).toEqual([
        ["a", "programmatic"],
        ["c", "programmatic"],
        ["b", "programmatic"],
      ]);
    });
  });

  it("should limit notifications to maxNotifications (bottom-right)", async () => {
    const { component } = render(NotificationQueueTest, {
      props: { position: "bottom-right", maxNotifications: 2 },
    });

    getQueue(component.queue).add({
      kind: "success",
      title: "First",
    });
    await tick();

    getQueue(component.queue).add({
      kind: "info",
      title: "Second",
    });
    await tick();

    getQueue(component.queue).add({
      kind: "warning",
      title: "Third",
    });
    await tick();

    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it.each<{
    position:
      | "top-right"
      | "top-left"
      | "top-center"
      | "bottom-right"
      | "bottom-left"
      | "bottom-center";
    className: string;
    styles: Record<string, string>;
    absent: string[];
  }>([
    {
      position: "top-right",
      className: "bx--notification-queue--top-right",
      styles: { top: "3rem", right: "1rem" },
      absent: ["bottom", "left", "transform"],
    },
    {
      position: "top-left",
      className: "bx--notification-queue--top-left",
      styles: { top: "3rem", left: "1rem" },
      absent: ["bottom", "right", "transform"],
    },
    {
      position: "top-center",
      className: "bx--notification-queue--top-center",
      styles: { top: "3rem", left: "50%", transform: "translateX(-50%)" },
      absent: ["bottom", "right"],
    },
    {
      position: "bottom-right",
      className: "bx--notification-queue--bottom-right",
      styles: { bottom: "1rem", right: "1rem" },
      absent: ["top", "left", "transform"],
    },
    {
      position: "bottom-left",
      className: "bx--notification-queue--bottom-left",
      styles: { bottom: "1rem", left: "1rem" },
      absent: ["top", "right", "transform"],
    },
    {
      position: "bottom-center",
      className: "bx--notification-queue--bottom-center",
      styles: { bottom: "1rem", left: "50%", transform: "translateX(-50%)" },
      absent: ["top", "right"],
    },
  ])(
    "should position notifications at $position",
    async ({ position, className, styles, absent }) => {
      const { component } = render(NotificationQueueTest, {
        props: { position },
      });

      getQueue(component.queue).add({
        kind: "success",
        title: "Test",
      });
      await tick();

      const queueContainer = document.querySelector(".bx--notification-queue");
      expect(queueContainer).toHaveClass("bx--notification-queue", className);
      expectInlineStyle(queueContainer, styles);

      const styleAttr = queueContainer?.getAttribute("style") ?? "";
      for (const property of absent) {
        expect(styleAttr).not.toMatch(new RegExp(`${property}\\s*:`));
      }
    },
  );

  it("should position notifications at top-right by default", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      kind: "success",
      title: "Test",
    });
    await tick();

    const queueContainer = document.querySelector(".bx--notification-queue");
    expect(queueContainer).toHaveClass("bx--notification-queue--top-right");
    expectInlineStyle(queueContainer, { top: "3rem", right: "1rem" });
  });

  it("should use custom offsets", async () => {
    const { component } = render(NotificationQueueTest, {
      props: {
        position: "top-left",
        offsetTop: "5rem",
        offsetLeft: "2rem",
      },
    });

    getQueue(component.queue).add({
      kind: "success",
      title: "Test",
    });
    await tick();

    const queueContainer = document.querySelector(".bx--notification-queue");
    expectInlineStyle(queueContainer, { top: "5rem", left: "2rem" });
  });

  it("should use custom z-index", async () => {
    const { component } = render(NotificationQueueTest, {
      props: { zIndex: 10000 },
    });

    getQueue(component.queue).add({
      kind: "success",
      title: "Test",
    });
    await tick();

    const queueContainer = document.querySelector('[style*="position: fixed"]');
    expect(queueContainer).toHaveStyle({ "z-index": "10000" });
  });

  it("should remove notification when close button is clicked", async () => {
    vi.useRealTimers();
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      kind: "success",
      title: "Test notification",
    });
    await tick();

    expect(screen.getByText("Test notification")).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    expect(screen.queryByText("Test notification")).not.toBeInTheDocument();
  });

  it("should remove notification after timeout", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      kind: "success",
      title: "Test notification",
      timeout: 1000,
    });
    await tick();

    expect(screen.getByText("Test notification")).toBeInTheDocument();

    vi.advanceTimersByTime(1000);
    await tick();

    expect(screen.queryByText("Test notification")).not.toBeInTheDocument();
  });

  it("should handle persistent notifications without timeout", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      kind: "warning",
      title: "Persistent notification",
      hideCloseButton: true,
    });
    await tick();

    expect(screen.getByText("Persistent notification")).toBeInTheDocument();

    vi.advanceTimersByTime(10000);
    await tick();

    expect(screen.getByText("Persistent notification")).toBeInTheDocument();
  });

  it("should handle notifications with all properties", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      id: "full-notification",
      kind: "info-square",
      title: "Full notification",
      subtitle: "Subtitle text",
      caption: "Caption text",
      timeout: 5000,
      lowContrast: true,
      closeButtonDescription: "Custom close",
      hideCloseButton: false,
    });
    await tick();

    expect(screen.getByText("Full notification")).toBeInTheDocument();
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
    expect(screen.getByText("Caption text")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom close")).toBeInTheDocument();
  });

  it("should forward toast-only props (pauseOnHover, role, fullWidth)", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      title: "Saved",
      pauseOnHover: true,
      role: "status",
      fullWidth: true,
      timeout: 0,
    });
    await tick();

    const toast = screen.getByRole("status");
    expect(toast).toBeInTheDocument();
    expectInlineStyle(toast, { width: "100%" });
  });

  it.each(["top-right", "top-left", "top-center"] as const)(
    "should prepend notifications for %s position",
    async (position) => {
      const { component } = render(NotificationQueueTest, {
        props: { position },
      });

      getQueue(component.queue).add({
        id: "first",
        kind: "success",
        title: "First",
      });
      await tick();

      getQueue(component.queue).add({
        id: "second",
        kind: "info",
        title: "Second",
      });
      await tick();

      const notifications = document.querySelectorAll(
        ".bx--toast-notification",
      );
      expect(notifications[0]).toHaveTextContent("Second");
      expect(notifications[1]).toHaveTextContent("First");
    },
  );

  it.each(["bottom-right", "bottom-left", "bottom-center"] as const)(
    "should append notifications for %s position",
    async (position) => {
      const { component } = render(NotificationQueueTest, {
        props: { position },
      });

      getQueue(component.queue).add({
        id: "first",
        kind: "success",
        title: "First",
      });
      await tick();

      getQueue(component.queue).add({
        id: "second",
        kind: "info",
        title: "Second",
      });
      await tick();

      const notifications = document.querySelectorAll(
        ".bx--toast-notification",
      );
      expect(notifications[0]).toHaveTextContent("First");
      expect(notifications[1]).toHaveTextContent("Second");
    },
  );

  it("should keep an empty container when all notifications are removed", async () => {
    vi.useRealTimers();
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      kind: "success",
      title: "Test notification",
    });
    await tick();

    expect(screen.getByText("Test notification")).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    const queueContainer = document.querySelector(".bx--notification-queue");
    expect(queueContainer).toBeInTheDocument();
    expect(queueContainer?.children).toHaveLength(0);
  });

  describe("NotificationButton Generics", () => {
    it("should support custom Icon types with generics", () => {
      type CustomIcon = new (...args: unknown[]) => unknown;

      type ComponentType = NotificationButtonComponent<CustomIcon>;
      type Props = ComponentProps<ComponentType>;

      expectTypeOf<Props["icon"]>().toEqualTypeOf<CustomIcon | undefined>();
    });

    it("should default to any type when generic is not specified", () => {
      type ComponentType = NotificationButtonComponent;
      type Props = ComponentProps<ComponentType>;

      // biome-ignore lint/suspicious/noExplicitAny: Testing default any type
      expectTypeOf<Props["icon"]>().toEqualTypeOf<any>();
    });
  });
});
