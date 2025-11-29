import { render, screen } from "@testing-library/svelte";
import type NotificationQueueComponent from "carbon-components-svelte/Notification/NotificationQueue.svelte";
import { tick } from "svelte";
import { user } from "../setup-tests";
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
    expect(queueContainer).toHaveStyle({
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

  it("should position notifications at top-right by default", async () => {
    const { component } = render(NotificationQueueTest);

    getQueue(component).add({
      kind: "success",
      title: "Test",
    });
    await tick();

    const queueContainer = document.querySelector('[style*="position: fixed"]');
    expect(queueContainer).toHaveStyle({ top: "3rem", right: "1rem" });
    const bottomValue = queueContainer
      ?.getAttribute("style")
      ?.match(/bottom:\s*([^;]+)/)?.[1]
      ?.trim();
    expect(bottomValue).toBeFalsy();
  });

  it("should position notifications at bottom-right", async () => {
    const { component } = render(NotificationQueueTest, {
      props: { position: "bottom-right" },
    });

    getQueue(component).add({
      kind: "success",
      title: "Test",
    });
    await tick();

    const queueContainer = document.querySelector('[style*="position: fixed"]');
    expect(queueContainer).toHaveStyle({ bottom: "1rem", right: "1rem" });
    const topValue = queueContainer
      ?.getAttribute("style")
      ?.match(/top:\s*([^;]+)/)?.[1]
      ?.trim();
    expect(topValue).toBeFalsy();
  });

  it("should use custom offsets", async () => {
    const { component } = render(NotificationQueueTest, {
      props: {
        position: "top-right",
        offsetTop: "5rem",
        offsetRight: "2rem",
      },
    });

    getQueue(component).add({
      kind: "success",
      title: "Test",
    });
    await tick();

    const queueContainer = document.querySelector('[style*="position: fixed"]');
    expect(queueContainer).toHaveStyle({ top: "5rem", right: "2rem" });
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
      statusIconDescription: "Custom status",
      hideCloseButton: false,
    });
    await tick();

    expect(screen.getByText("Full notification")).toBeInTheDocument();
    expect(screen.getByText("Subtitle text")).toBeInTheDocument();
    expect(screen.getByText("Caption text")).toBeInTheDocument();
    expect(screen.getByLabelText("Custom close")).toBeInTheDocument();
  });

  it("should handle notification order for top-right position", async () => {
    const { component } = render(NotificationQueueTest, {
      props: { position: "top-right" },
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
  });

  it("should handle notification order for bottom-right position", async () => {
    const { component } = render(NotificationQueueTest, {
      props: { position: "bottom-right" },
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
  });

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
});
