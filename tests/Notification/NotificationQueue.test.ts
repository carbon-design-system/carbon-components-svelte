import { fireEvent, render, screen, within } from "@testing-library/svelte";
import type NotificationQueueComponent from "carbon-components-svelte/Notification/NotificationQueue.svelte";
import { tick } from "svelte";
import { NOTIFICATION_QUEUE_COLLAPSE_MS } from "../../src/constants/timing.js";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import NotificationQueueTest from "./NotificationQueue.test.svelte";

function getQueue(
  queue: NotificationQueueComponent | undefined,
): NotificationQueueComponent {
  assert(queue);
  return queue;
}

const shellTop = "calc(var(--ccs-shell-offset, 0px) + 3rem)";

describe("NotificationQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not render when no notifications are added", () => {
    const { container } = render(NotificationQueueTest);

    const queueContainer = container.querySelector(
      '[style*="position: fixed"]',
    );
    expect(queueContainer).not.toBeInTheDocument();
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

  it("should not put the queue id on the toast element", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({ id: "save", title: "Saved" });
    await tick();

    expect(screen.getByRole("status")).not.toHaveAttribute("id");
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

    const notifications = screen.getAllByRole("status");
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
    expect(screen.getAllByRole("status")).toHaveLength(1);
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

    expect(screen.getByRole("status")).toHaveClass(
      "bx--toast-notification--info",
    );

    getQueue(component.queue).update(id, { kind: "success" });
    await tick();

    expect(screen.getByRole("status")).toHaveClass(
      "bx--toast-notification--success",
    );
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("should keep the same toast element when updating it", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({ title: "Uploading" });
    await tick();
    const toast = screen.getByRole("status");

    getQueue(component.queue).update(id, { title: "Done" });
    await tick();

    expect(screen.getByRole("status")).toBe(toast);
  });

  it("should not restart the timeout when updating a toast", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({
      title: "Uploading",
      timeout: 1000,
    });
    await tick();

    vi.advanceTimersByTime(400);
    getQueue(component.queue).update(id, { title: "Done" });
    await tick();
    vi.advanceTimersByTime(600);
    await tick();

    expect(screen.queryByText("Done")).not.toBeInTheDocument();
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

  it.each([
    [
      "remove",
      (queue: NotificationQueueComponent, id: string) => queue.remove(id),
    ],
    ["clear", (queue: NotificationQueueComponent) => queue.clear()],
  ] as const)(
    "should return focus when %s unmounts a focused toast",
    async (_, dismiss) => {
      const { component } = render(NotificationQueueTest);
      const before = document.createElement("button");
      document.body.append(before);
      onTestFinished(() => before.remove());

      const id = getQueue(component.queue).add({ title: "Saved" });
      await tick();
      before.focus();
      screen.getByRole("button", { name: "Close notification" }).focus();

      dismiss(getQueue(component.queue), id);
      await tick();

      expect(before).toHaveFocus();
    },
  );

  it("focuses an actionable toast, removes it on Escape, and returns focus", async () => {
    const { component } = render(NotificationQueueTest);
    const before = document.createElement("button");
    document.body.append(before);
    onTestFinished(() => before.remove());
    before.focus();

    getQueue(component.queue).add({
      title: "Upload failed",
      subtitle: "Retry from the files list.",
      actionable: true,
    });
    await tick();
    await tick();

    const dialog = screen.getByRole("alertdialog", { name: "Upload failed" });
    const close = within(dialog).getByRole("button", {
      name: "Close notification",
    });
    expect(close).toHaveFocus();

    await fireEvent.keyDown(close, { key: "Escape" });
    await tick();

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(before).toHaveFocus();
  });

  it.each(["top-right", "bottom-right"] as const)(
    "should limit notifications to maxNotifications (%s)",
    async (position) => {
      const { component } = render(NotificationQueueTest, {
        props: { position, maxNotifications: 2 },
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
    },
  );

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
      styles: {
        position: "fixed",
        top: shellTop,
        right: "1rem",
        "z-index": "9000",
      },
      absent: ["bottom", "left", "transform"],
    },
    {
      position: "top-left",
      className: "bx--notification-queue--top-left",
      styles: { top: shellTop, left: "1rem" },
      absent: ["bottom", "right", "transform"],
    },
    {
      position: "top-center",
      className: "bx--notification-queue--top-center",
      styles: { top: shellTop, left: "50%", transform: "translateX(-50%)" },
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
    expect(
      document.querySelector('[style*="position: fixed"]'),
    ).not.toBeInTheDocument();
  });

  it("should only remove the toast whose close button is clicked", async () => {
    vi.useRealTimers();
    const { component } = render(NotificationQueueTest, {
      props: { position: "bottom-right" },
    });

    getQueue(component.queue).add({ title: "First" });
    getQueue(component.queue).add({ title: "Second" });
    await tick();

    const secondToast = screen.getAllByRole("status")[1];
    expect(secondToast).toHaveTextContent("Second");
    await user.click(
      within(secondToast).getByRole("button", { name: "Close notification" }),
    );
    await tick();

    expect(screen.queryByText("Second")).not.toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
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

  it("should stay paused when the timeout is updated while hovered", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component.queue).add({
      title: "Uploading",
      timeout: 1000,
      pauseOnHover: true,
    });
    await tick();

    await fireEvent.mouseEnter(screen.getByRole("status"));
    getQueue(component.queue).update(id, { timeout: 2000 });
    await tick();
    vi.advanceTimersByTime(3000);
    await tick();

    expect(screen.getByText("Uploading")).toBeInTheDocument();
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

  it("should forward toast-only props (pauseOnHover, role, fullWidth, statusIconDescription)", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component.queue).add({
      title: "Saved",
      kind: "success",
      pauseOnHover: true,
      role: "alert",
      fullWidth: true,
      statusIconDescription: "Réussite",
      timeout: 1000,
    });
    await tick();

    const toast = screen.getByRole("alert");
    expect(within(toast).getByRole("img", { name: "Réussite" })).toBeVisible();
    expectInlineStyle(toast, { width: "100%" });

    await fireEvent.mouseEnter(toast);
    vi.advanceTimersByTime(3000);
    await tick();

    expect(screen.getByText("Saved")).toBeInTheDocument();

    await fireEvent.mouseLeave(toast);
    vi.advanceTimersByTime(1000);
    await tick();

    expect(screen.queryByText("Saved")).not.toBeInTheDocument();
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

      const notifications = screen.getAllByRole("status");
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

      const notifications = screen.getAllByRole("status");
      expect(notifications[0]).toHaveTextContent("First");
      expect(notifications[1]).toHaveTextContent("Second");
    },
  );

  describe("actions", () => {
    function focusOutside() {
      const before = document.createElement("button");
      before.textContent = "Before";
      document.body.append(before);
      onTestFinished(() => before.remove());
      before.focus();
      return before;
    }

    it("renders the action as a tertiary button", async () => {
      const { component } = render(NotificationQueueTest);

      getQueue(component.queue).add({
        title: "Upload failed",
        action: { label: "Retry" },
      });
      await tick();

      const toast = screen.getByRole("status");
      const retry = within(toast).getByRole("button", { name: "Retry" });
      expect(retry).toHaveClass(
        "bx--toast-notification__action-button",
        "bx--btn--tertiary",
      );
    });

    it("renders an action with href as a link", async () => {
      const { component } = render(NotificationQueueTest);

      getQueue(component.queue).add({
        title: "Export ready",
        action: { label: "Download", href: "/exports/q3.csv" },
      });
      await tick();

      expect(screen.getByRole("link", { name: "Download" })).toHaveAttribute(
        "href",
        "/exports/q3.csv",
      );
    });

    it("renders no action row without an action", async () => {
      const { component } = render(NotificationQueueTest);

      getQueue(component.queue).add({ title: "Saved" });
      await tick();

      expect(
        document.querySelector(".bx--toast-notification__actions"),
      ).not.toBeInTheDocument();
    });

    it("calls onClick, removes the toast, and returns focus", async () => {
      const { component } = render(NotificationQueueTest);
      const before = focusOutside();
      const onClick = vi.fn();

      getQueue(component.queue).add({
        title: "Report deleted",
        action: { label: "Undo", onClick },
      });
      await tick();

      const undo = screen.getByRole("button", { name: "Undo" });
      undo.focus();
      await fireEvent.click(undo);
      await tick();

      expect(onClick).toHaveBeenCalledOnce();
      expect(onClick.mock.calls[0][0]).toBeInstanceOf(MouseEvent);
      expect(screen.queryByText("Report deleted")).not.toBeInTheDocument();
      expect(before).toHaveFocus();
    });

    it("keeps the toast open when onClick calls preventDefault", async () => {
      const { component } = render(NotificationQueueTest);

      const id = getQueue(component.queue).add({
        title: "Upload failed",
        action: {
          label: "Retry",
          onClick: (event) => {
            event.preventDefault();
            getQueue(component.queue).update(id, { title: "Retrying" });
          },
        },
      });
      await tick();

      await fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      await tick();

      expect(screen.getByText("Retrying")).toBeInTheDocument();
    });

    it("keeps focus where it is when a toast with an action opens", async () => {
      const { component } = render(NotificationQueueTest);
      const before = focusOutside();

      getQueue(component.queue).add({
        title: "Upload failed",
        action: { label: "Retry" },
      });
      await tick();
      await tick();

      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(before).toHaveFocus();
    });

    it.each([
      ["an action", { action: { label: "Undo" } }],
      ["actionable", { actionable: true, focusOnOpen: false }],
    ] as const)("ignores timeout for %s", async (_, props) => {
      const { component } = render(NotificationQueueTest);

      const id = getQueue(component.queue).add({
        title: "Report deleted",
        timeout: 1000,
        ...props,
      });
      await tick();
      vi.advanceTimersByTime(5000);
      await tick();
      expect(screen.getByText("Report deleted")).toBeInTheDocument();

      getQueue(component.queue).update(id, { timeout: 500 });
      await tick();
      vi.advanceTimersByTime(5000);
      await tick();
      expect(screen.getByText("Report deleted")).toBeInTheDocument();
    });

    it.each(["top-right", "bottom-right"] as const)(
      "drops the oldest toast without an action first (%s)",
      async (position) => {
        const { component } = render(NotificationQueueTest, {
          props: { position, maxNotifications: 2 },
        });
        const queue = getQueue(component.queue);

        queue.add({ title: "Deleted", action: { label: "Undo" } });
        queue.add({ title: "Saved" });
        queue.add({ title: "Published" });
        await tick();

        expect(screen.getByText("Deleted")).toBeInTheDocument();
        expect(screen.queryByText("Saved")).not.toBeInTheDocument();
        expect(screen.getByText("Published")).toBeInTheDocument();
      },
    );

    it("drops the oldest toast when every older toast has an action", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { maxNotifications: 2 },
      });
      const queue = getQueue(component.queue);

      queue.add({ title: "First", action: { label: "Undo" } });
      queue.add({ title: "Second", action: { label: "Undo" } });
      queue.add({ title: "Saved" });
      await tick();

      expect(screen.queryByText("First")).not.toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });
  });

  describe("pause", () => {
    function getRegion() {
      return screen.getByRole("region", { name: "Notifications" });
    }

    async function advance(ms: number) {
      vi.advanceTimersByTime(ms);
      await tick();
    }

    it("pauses every timer while the pointer is in the queue", async () => {
      const { component } = render(NotificationQueueTest);
      getQueue(component.queue).add({ title: "Saved", timeout: 1000 });
      getQueue(component.queue).add({ title: "Synced", timeout: 2000 });
      await tick();

      await advance(400);
      await fireEvent.pointerEnter(getRegion(), { pointerType: "mouse" });
      await advance(5000);
      expect(screen.getByText("Saved")).toBeInTheDocument();
      expect(screen.getByText("Synced")).toBeInTheDocument();

      // Each toast resumes with the time it had left.
      await fireEvent.pointerLeave(getRegion(), { pointerType: "mouse" });
      await advance(599);
      expect(screen.getByText("Saved")).toBeInTheDocument();
      await advance(1);
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
      await advance(999);
      expect(screen.getByText("Synced")).toBeInTheDocument();
      await advance(1);
      expect(screen.queryByText("Synced")).not.toBeInTheDocument();
    });

    it("does not pause for touch, which has no hover", async () => {
      const { component } = render(NotificationQueueTest);
      getQueue(component.queue).add({ title: "Saved", timeout: 1000 });
      await tick();

      await fireEvent.pointerEnter(getRegion(), { pointerType: "touch" });
      await advance(1000);

      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
    });

    it("stays paused while focus moves between toasts", async () => {
      const { component } = render(NotificationQueueTest);
      const before = document.createElement("button");
      document.body.append(before);
      onTestFinished(() => before.remove());
      getQueue(component.queue).add({ title: "Saved", timeout: 1000 });
      getQueue(component.queue).add({ title: "Synced", timeout: 1000 });
      await tick();

      const [first, second] = screen.getAllByRole("button", {
        name: "Close notification",
      });
      first.focus();
      await tick();
      await advance(5000);
      second.focus();
      await tick();
      await advance(5000);
      expect(screen.getByText("Saved")).toBeInTheDocument();
      expect(screen.getByText("Synced")).toBeInTheDocument();

      before.focus();
      await tick();
      await advance(1000);
      expect(screen.queryByText("Saved")).not.toBeInTheDocument();
      expect(screen.queryByText("Synced")).not.toBeInTheDocument();
    });

    it("resumes when the focused toast is removed", async () => {
      const { component } = render(NotificationQueueTest);
      getQueue(component.queue).add({ title: "Saved" });
      // No control in "Synced", so focus leaves the queue.
      getQueue(component.queue).add({
        title: "Synced",
        timeout: 1000,
        hideCloseButton: true,
      });
      await tick();

      const saved = screen.getByText("Saved").closest('[role="status"]');
      assert(saved instanceof HTMLElement);
      const close = within(saved).getByRole("button", {
        name: "Close notification",
      });
      close.focus();
      await fireEvent.click(close);
      await tick();
      await advance(1000);

      expect(screen.queryByText("Synced")).not.toBeInTheDocument();
    });

    it("starts a toast added while paused paused", async () => {
      const { component } = render(NotificationQueueTest);
      getQueue(component.queue).add({ title: "Saved", timeout: 1000 });
      await tick();

      await fireEvent.pointerEnter(getRegion(), { pointerType: "mouse" });
      getQueue(component.queue).add({ title: "Synced", timeout: 1000 });
      await tick();
      await advance(5000);
      expect(screen.getByText("Synced")).toBeInTheDocument();

      await fireEvent.pointerLeave(getRegion(), { pointerType: "mouse" });
      await advance(1000);
      expect(screen.queryByText("Synced")).not.toBeInTheDocument();
    });

    it("forgets the pointer when the queue empties", async () => {
      const { component } = render(NotificationQueueTest);
      getQueue(component.queue).add({ title: "Saved" });
      await tick();

      await fireEvent.pointerEnter(getRegion(), { pointerType: "mouse" });
      getQueue(component.queue).clear();
      await tick();
      getQueue(component.queue).add({ title: "Synced", timeout: 1000 });
      await tick();
      await advance(1000);

      expect(screen.queryByText("Synced")).not.toBeInTheDocument();
    });
  });

  describe("layout hold", () => {
    function getRegion() {
      return screen.getByRole("region", { name: "Notifications" });
    }

    function getTitles() {
      return Array.from(
        document.querySelectorAll(".bx--toast-notification__title"),
        (node) => node.textContent,
      );
    }

    it("keeps a closed toast's space until the pointer leaves", async () => {
      const { component } = render(NotificationQueueTest);
      getQueue(component.queue).add({ title: "Saved" });
      getQueue(component.queue).add({ title: "Synced" });
      await tick();

      await fireEvent.pointerEnter(getRegion(), { pointerType: "mouse" });
      // The newest toast, at the top. "Saved" would slide into its place.
      await fireEvent.click(
        screen.getAllByRole("button", { name: "Close notification" })[0],
      );
      const placeholder = getRegion().querySelector(
        ".bx--notification-queue__placeholder",
      );
      expect(placeholder).toHaveAttribute("aria-hidden", "true");
      expect(getTitles()).toEqual(["Saved"]);

      await fireEvent.pointerLeave(getRegion(), { pointerType: "mouse" });
      expect(placeholder).toBeInTheDocument();
      vi.advanceTimersByTime(NOTIFICATION_QUEUE_COLLAPSE_MS);
      await tick();
      expect(placeholder).not.toBeInTheDocument();
    });

    it("holds drops while focus is in the queue", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { maxNotifications: 2 },
      });
      const before = document.createElement("button");
      document.body.append(before);
      onTestFinished(() => before.remove());
      getQueue(component.queue).add({ title: "First" });
      getQueue(component.queue).add({ title: "Second" });
      await tick();

      screen.getAllByRole("button", { name: "Close notification" })[0].focus();
      getQueue(component.queue).add({ title: "Third" });
      await tick();
      expect(getTitles()).toEqual(["Second", "First", "Third"]);

      before.focus();
      await tick();
      expect(getTitles()).toEqual(["Third", "Second"]);
    });

    it("moves focus to the newest toast on F6 during a hold", async () => {
      const { component } = render(NotificationQueueTest);
      const before = document.createElement("button");
      document.body.append(before);
      onTestFinished(() => before.remove());
      before.focus();
      getQueue(component.queue).add({
        title: "First",
        action: { label: "Undo first" },
      });
      await tick();

      await fireEvent.pointerEnter(getRegion(), { pointerType: "mouse" });
      getQueue(component.queue).add({
        title: "Second",
        action: { label: "Undo second" },
      });
      await tick();
      expect(getTitles()).toEqual(["First", "Second"]);

      await fireEvent.keyDown(before, { key: "F6" });
      expect(screen.getByRole("button", { name: "Undo second" })).toHaveFocus();
    });
  });

  describe("landmark", () => {
    it("renders the queue as a region named Notifications", async () => {
      const { component } = render(NotificationQueueTest);

      getQueue(component.queue).add({ title: "Saved" });
      await tick();

      expect(screen.getByRole("region", { name: "Notifications" })).toHaveClass(
        "bx--notification-queue",
      );
    });

    it("names the region with labelText", async () => {
      const { component } = render(NotificationQueueTest, {
        props: { labelText: "Alerts" },
      });

      getQueue(component.queue).add({ title: "Saved" });
      await tick();

      expect(
        screen.getByRole("region", { name: "Alerts" }),
      ).toBeInTheDocument();
    });

    it.each(["top-right", "bottom-right"] as const)(
      "moves focus to the newest toast on F6 and back on Shift+F6 (%s)",
      async (position) => {
        const { component } = render(NotificationQueueTest, {
          props: { position },
        });
        const before = document.createElement("button");
        document.body.append(before);
        onTestFinished(() => before.remove());
        before.focus();

        getQueue(component.queue).add({
          title: "First",
          action: { label: "Undo first" },
        });
        getQueue(component.queue).add({
          title: "Second",
          action: { label: "Undo second" },
        });
        await tick();

        await fireEvent.keyDown(before, { key: "F6" });
        const undo = screen.getByRole("button", { name: "Undo second" });
        expect(undo).toHaveFocus();

        await fireEvent.keyDown(undo, { key: "F6", shiftKey: true });
        expect(before).toHaveFocus();
      },
    );

    it("focuses the close button of a toast without an action", async () => {
      const { component } = render(NotificationQueueTest);
      document.body.focus();

      getQueue(component.queue).add({ title: "Saved" });
      await tick();

      await fireEvent.keyDown(document.body, { key: "F6" });
      expect(
        screen.getByRole("button", { name: "Close notification" }),
      ).toHaveFocus();
    });

    it("leaves F6 to the browser when no toast has a control", async () => {
      const { component } = render(NotificationQueueTest);

      getQueue(component.queue).add({ title: "Saving", hideCloseButton: true });
      await tick();

      const event = new KeyboardEvent("keydown", {
        key: "F6",
        bubbles: true,
        cancelable: true,
      });
      window.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe("focus after close", () => {
    function closeButton(title: string) {
      const toast = screen
        .getByText(title)
        .closest<HTMLElement>(".bx--toast-notification");
      assert(toast);
      return within(toast).getByRole("button", { name: "Close notification" });
    }

    async function setup(
      position: "top-right" | "bottom-right",
      notifications: Parameters<NotificationQueueComponent["add"]>[0][],
    ) {
      const { component } = render(NotificationQueueTest, {
        props: { position },
      });
      const queue = getQueue(component.queue);
      const before = document.createElement("button");
      document.body.append(before);
      onTestFinished(() => before.remove());
      before.focus();

      for (const notification of notifications) queue.add(notification);
      await tick();
      await tick();
      return { queue, before };
    }

    // Top positions show the newest toast first: C, B, A.
    it.each([
      { position: "top-right", close: "B", next: "A" },
      { position: "top-right", close: "A", next: "B" },
      { position: "bottom-right", close: "B", next: "C" },
      { position: "bottom-right", close: "C", next: "B" },
    ] as const)(
      "moves focus from $close to $next ($position)",
      async ({ position, close, next }) => {
        await setup(position, [{ title: "A" }, { title: "B" }, { title: "C" }]);
        closeButton(close).focus();

        await fireEvent.click(closeButton(close));
        await tick();

        expect(screen.queryByText(close)).not.toBeInTheDocument();
        expect(closeButton(next)).toHaveFocus();
      },
    );

    it("moves focus to the next toast when Escape closes an actionable one", async () => {
      const { queue, before } = await setup("top-right", [
        { title: "A", actionable: true },
      ]);
      before.focus();
      queue.add({ title: "B", actionable: true });
      await tick();
      await tick();
      expect(closeButton("B")).toHaveFocus();

      await fireEvent.keyDown(closeButton("B"), { key: "Escape" });
      await tick();

      expect(closeButton("A")).toHaveFocus();
    });

    it("moves focus to the next toast when an action closes its toast", async () => {
      const { before } = await setup("top-right", [
        { title: "A", action: { label: "Undo A" } },
        { title: "B", action: { label: "Undo B" } },
      ]);
      await fireEvent.keyDown(before, { key: "F6" });

      await fireEvent.click(screen.getByRole("button", { name: "Undo B" }));
      await tick();

      expect(screen.getByRole("button", { name: "Undo A" })).toHaveFocus();
    });

    it("returns focus to where F6 took it from once the queue empties", async () => {
      const { before } = await setup("top-right", [
        { title: "A" },
        { title: "B" },
      ]);
      await fireEvent.keyDown(before, { key: "F6" });

      await fireEvent.click(closeButton("B"));
      await tick();
      expect(closeButton("A")).toHaveFocus();

      await fireEvent.click(closeButton("A"));
      await tick();
      expect(screen.queryByRole("region")).not.toBeInTheDocument();
      expect(before).toHaveFocus();
    });

    it("keeps focus in place when a timeout closes a toast", async () => {
      const { before } = await setup("top-right", [
        { title: "A", timeout: 1000 },
        { title: "B" },
      ]);

      vi.advanceTimersByTime(1000);
      await tick();

      expect(screen.queryByText("A")).not.toBeInTheDocument();
      expect(before).toHaveFocus();
    });

    it("keeps focus in place when a toast closes without focus", async () => {
      const { queue, before } = await setup("top-right", [
        { id: "a", title: "A" },
        { id: "b", title: "B" },
        { id: "c", title: "C" },
      ]);
      await fireEvent.keyDown(before, { key: "F6" });
      closeButton("A").focus();

      queue.remove("b");
      await tick();

      expect(closeButton("A")).toHaveFocus();
    });
  });
});
