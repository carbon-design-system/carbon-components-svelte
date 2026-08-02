import { render, screen } from "@testing-library/svelte";
import type NotificationButtonComponent from "carbon-components-svelte/Notification/NotificationButton.svelte";
import type NotificationQueueComponent from "carbon-components-svelte/Notification/NotificationQueue.svelte";
import type { ComponentProps } from "svelte";
import { tick } from "svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import NotificationQueueTest from "./NotificationQueue.test.svelte";

function getQueue(
  component: Record<string, unknown>,
): NotificationQueueComponent {
  const queue = component.queue as NotificationQueueComponent | undefined;
  if (!queue) {
    throw new Error("Queue not bound");
  }
  return queue;
}

describe("NotificationQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("should render with default props", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component).add({
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

    const id = getQueue(component).add({
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

    const id1 = getQueue(component).add({
      kind: "info",
      title: "Notification 1",
    });
    await tick();

    const id2 = getQueue(component).add({
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

    const id = getQueue(component).add({
      id: "custom-id",
      kind: "warning",
      title: "Custom ID notification",
    });
    await tick();

    expect(id).toBe("custom-id");
  });

  it("should deduplicate notifications by id", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component).add({
      id: "duplicate-id",
      kind: "error",
      title: "First notification",
    });

    const id2 = getQueue(component).add({
      id: "duplicate-id",
      kind: "error",
      title: "Second notification",
    });
    await tick();

    expect(id).toBe("duplicate-id");
    expect(id2).toBe("duplicate-id");

    const notifications = screen.getAllByRole("alert");
    expect(notifications).toHaveLength(1);
    expect(screen.getByText("First notification")).toBeInTheDocument();
    expect(screen.queryByText("Second notification")).not.toBeInTheDocument();
  });

  it("should add multiple notifications", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component).add({
      kind: "success",
      title: "First notification",
    });
    await tick();

    getQueue(component).add({
      kind: "info",
      title: "Second notification",
    });
    await tick();

    getQueue(component).add({
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

    const id1 = getQueue(component).add({
      kind: "success",
      title: "First notification",
    });
    await tick();

    getQueue(component).add({
      kind: "info",
      title: "Second notification",
    });
    await tick();

    expect(screen.getByText("First notification")).toBeInTheDocument();
    expect(screen.getByText("Second notification")).toBeInTheDocument();

    const removed = getQueue(component).remove(id1);
    await tick();
    expect(removed).toBe(true);

    expect(screen.queryByText("First notification")).not.toBeInTheDocument();
    expect(screen.getByText("Second notification")).toBeInTheDocument();
  });

  it("should return false when removing non-existent notification", () => {
    const { component } = render(NotificationQueueTest);

    const removed = getQueue(component).remove("non-existent-id");
    expect(removed).toBe(false);
  });

  it("should update an existing notification in place", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component).add({
      id: "progress",
      kind: "info",
      title: "Uploading...",
      subtitle: "0%",
    });
    await tick();

    expect(screen.getByText("Uploading...")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();

    const updated = getQueue(component).update(id, {
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
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("should merge patch into existing notification on update", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component).add({
      id: "merge",
      kind: "info",
      title: "Title",
      subtitle: "Subtitle",
    });
    await tick();

    getQueue(component).update(id, { kind: "success" });
    await tick();

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("should ignore id changes on update", async () => {
    const { component } = render(NotificationQueueTest);

    const id = getQueue(component).add({
      id: "original",
      kind: "info",
      title: "Original",
    });
    await tick();

    const updated = getQueue(component).update(id, {
      id: "different",
      title: "Updated",
    });
    await tick();

    expect(updated).toBe(true);
    expect(screen.getByText("Updated")).toBeInTheDocument();

    const removed = getQueue(component).remove("original");
    await tick();
    expect(removed).toBe(true);
    expect(screen.queryByText("Updated")).not.toBeInTheDocument();
  });

  it("should return false when updating non-existent notification", () => {
    const { component } = render(NotificationQueueTest);

    const updated = getQueue(component).update("non-existent-id", {
      title: "New title",
    });
    expect(updated).toBe(false);
  });

  it("should clear all notifications", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component).add({
      kind: "success",
      title: "First notification",
    });
    await tick();

    getQueue(component).add({
      kind: "info",
      title: "Second notification",
    });
    await tick();

    expect(screen.getByText("First notification")).toBeInTheDocument();
    expect(screen.getByText("Second notification")).toBeInTheDocument();

    getQueue(component).clear();
    await tick();

    expect(screen.queryByText("First notification")).not.toBeInTheDocument();
    expect(screen.queryByText("Second notification")).not.toBeInTheDocument();
  });

  it("should limit notifications to maxNotifications (top-right)", async () => {
    const { component } = render(NotificationQueueTest, {
      props: { maxNotifications: 2 },
    });

    getQueue(component).add({
      kind: "success",
      title: "First",
    });
    await tick();

    getQueue(component).add({
      kind: "info",
      title: "Second",
    });
    await tick();

    getQueue(component).add({
      kind: "warning",
      title: "Third",
    });
    await tick();

    expect(screen.queryByText("First")).not.toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
  });

  it("should limit notifications to maxNotifications (bottom-right)", async () => {
    const { component } = render(NotificationQueueTest, {
      props: { position: "bottom-right", maxNotifications: 2 },
    });

    getQueue(component).add({
      kind: "success",
      title: "First",
    });
    await tick();

    getQueue(component).add({
      kind: "info",
      title: "Second",
    });
    await tick();

    getQueue(component).add({
      kind: "warning",
      title: "Third",
    });
    await tick();

    // Should only show the last 2 (most recent)
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

      getQueue(component).add({
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

    getQueue(component).add({
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

    getQueue(component).add({
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

    getQueue(component).add({
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

    getQueue(component).add({
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

    getQueue(component).add({
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

    getQueue(component).add({
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

    getQueue(component).add({
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

  it.each(["top-right", "top-left", "top-center"] as const)(
    "should prepend notifications for %s position",
    async (position) => {
      const { component } = render(NotificationQueueTest, {
        props: { position },
      });

      getQueue(component).add({
        id: "first",
        kind: "success",
        title: "First",
      });
      await tick();

      getQueue(component).add({
        id: "second",
        kind: "info",
        title: "Second",
      });
      await tick();

      const notifications = screen.getAllByRole("alert");
      expect(notifications[0]).toHaveTextContent("Second");
      expect(notifications[1]).toHaveTextContent("First");
    },
  );

  it("should render action button from actionText and invoke onAction", async () => {
    vi.useRealTimers();
    const onAction = vi.fn();
    const { component } = render(NotificationQueueTest);

    getQueue(component).add({
      kind: "success",
      title: "Item deleted",
      subtitle: "You can undo this action.",
      actionText: "Undo",
      onAction,
    });
    await tick();

    const actionButton = screen.getByRole("button", { name: "Undo" });
    expect(actionButton).toBeInTheDocument();

    await user.click(actionButton);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("should not render action button when actionText is omitted", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component).add({
      kind: "success",
      title: "No action",
    });
    await tick();

    expect(
      screen.queryByRole("button", { name: "Undo" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Close notification")).toBeInTheDocument();
  });

  it.each(["bottom-right", "bottom-left", "bottom-center"] as const)(
    "should append notifications for %s position",
    async (position) => {
      const { component } = render(NotificationQueueTest, {
        props: { position },
      });

      getQueue(component).add({
        id: "first",
        kind: "success",
        title: "First",
      });
      await tick();

      getQueue(component).add({
        id: "second",
        kind: "info",
        title: "Second",
      });
      await tick();

      const notifications = screen.getAllByRole("alert");
      expect(notifications[0]).toHaveTextContent("First");
      expect(notifications[1]).toHaveTextContent("Second");
    },
  );

  it("should not render container when all notifications are removed", async () => {
    vi.useRealTimers();
    const { component, container } = render(NotificationQueueTest);

    getQueue(component).add({
      kind: "success",
      title: "Test notification",
    });
    await tick();

    expect(screen.getByText("Test notification")).toBeInTheDocument();

    const closeButton = screen.getByLabelText("Close notification");
    await user.click(closeButton);
    await tick();

    const queueContainer = container.querySelector(
      '[style*="position: fixed"]',
    );
    expect(queueContainer).not.toBeInTheDocument();
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
