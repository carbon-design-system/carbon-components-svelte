import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Host from "./NotificationsPanel.host.test.svelte";
import Slots from "./NotificationsPanel.slots.test.svelte";
import NotificationsPanel from "./NotificationsPanel.test.svelte";

const NOW = Date.UTC(2026, 9, 27, 15, 0, 0);
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const items = () => [
  { id: "a", title: "Build failed", timestamp: NOW - HOUR, unread: true },
  { id: "b", title: "Deploy finished", timestamp: NOW - 2 * HOUR },
  { id: "c", title: "Invoice ready", timestamp: NOW - DAY - HOUR },
  { id: "d", title: "Old news", timestamp: NOW - 5 * DAY, dismissible: false },
];

// A row's button is named by its text, after "Unread" when it is unread. The
// dismiss button starts with "Dismiss notification".
const row = (title: string) =>
  screen.getByRole("button", { name: new RegExp(`^(Unread )?${title}`) });

const events = () => screen.getByTestId("events").textContent;

describe("NotificationsPanel", () => {
  it("groups rows by recency under headings and names the region", () => {
    render(NotificationsPanel, { notifications: items() });

    const region = screen.getByRole("region", { name: "Notifications" });
    expect(
      within(region)
        .getAllByRole("heading", { level: 3 })
        .map((heading) => heading.textContent?.trim()),
    ).toEqual(["Today", "Yesterday", "Previous"]);
    const lists = within(region).getAllByRole("list");
    expect(
      lists.map((list) => within(list).getAllByRole("listitem").length),
    ).toEqual([2, 1, 1]);
    expect(lists[0]).toHaveAccessibleName("Today");
  });

  it("renders one list without headings when not grouped", () => {
    render(NotificationsPanel, { notifications: items(), grouped: false });

    expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
    expect(screen.getAllByRole("list")).toHaveLength(1);
  });

  it("marks an unread row and names the icon by kind", () => {
    render(NotificationsPanel, {
      notifications: [{ ...items()[0], kind: "warning" }, items()[1]],
    });

    const [unread, read] = screen.getAllByRole("listitem");
    expect(unread).toHaveClass("bx--notifications-panel__item--unread");
    expect(within(unread).getByText("Unread")).toHaveClass(
      "bx--visually-hidden",
    );
    expect(within(unread).getByTitle("Warning")).toBeInTheDocument();
    expect(read).not.toHaveClass("bx--notifications-panel__item--unread");
    expect(within(read).queryByText("Unread")).toBeNull();
  });

  it("names the status icon from statusIconDescription", () => {
    render(NotificationsPanel, {
      notifications: [
        { ...items()[0], kind: "warning", statusIconDescription: "Attention" },
      ],
    });

    expect(screen.getByTitle("Attention")).toBeInTheDocument();
    expect(screen.queryByTitle("Warning")).toBeNull();
  });

  it("shows a caption in place of the relative time", () => {
    render(NotificationsPanel, {
      notifications: [{ ...items()[0], caption: "Run 42" }, items()[1]],
    });

    const [first, second] = screen.getAllByRole("listitem");
    expect(within(first).getByText("Run 42")).toBeInTheDocument();
    expect(first.querySelector("time")).toBeNull();
    expect(second.querySelector("time")).not.toBeNull();
  });

  it("dispatches click, dismiss, dismiss:all and view:all without changing the array", async () => {
    const notifications = Object.freeze(
      items().map((item) => Object.freeze(item)),
    );
    render(NotificationsPanel, {
      notifications: notifications as ReturnType<typeof items>,
      remove: false,
      viewAllText: "View all",
    });

    await user.click(row("Build failed"));
    await user.click(
      screen.getByRole("button", {
        name: "Dismiss notification: Deploy finished",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Dismiss all" }));
    await user.click(screen.getByRole("button", { name: "View all" }));

    expect(events()).toBe("click:a,dismiss:b,dismiss:all,view:all");
    expect(notifications.map((item) => item.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("hides the dismiss button on a row that is not dismissible", () => {
    render(NotificationsPanel, { notifications: items() });

    expect(
      screen.getAllByRole("button", { name: /^Dismiss notification/ }),
    ).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: "Dismiss notification: Old news" }),
    ).toBeNull();
  });

  it("shows the empty text and hides Dismiss all with no notifications", () => {
    render(NotificationsPanel, { notifications: [] });

    expect(screen.getByText("You're all caught up")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Dismiss all" })).toBeNull();
  });

  it("renders the actions, empty and notification slots", async () => {
    const { rerender } = render(Slots, { notifications: [] });
    expect(
      screen.getByRole("button", { name: "Settings" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();

    await rerender({
      notifications: [{ id: "a", title: "One", timestamp: NOW - HOUR }],
    });
    expect(screen.getByText("Custom One")).toBeInTheDocument();
    expect(screen.queryByText("Nothing yet")).toBeNull();
  });

  it("renders static rows when not interactive", () => {
    render(NotificationsPanel, { notifications: items(), interactive: false });

    expect(
      screen.queryByRole("button", { name: /^(Unread )?Build failed/ }),
    ).toBeNull();
    expect(screen.getByText("Build failed")).toBeInTheDocument();
  });

  describe("Do Not Disturb", () => {
    it("renders the toggle only with a label, and binds its state", async () => {
      const { rerender } = render(NotificationsPanel, {
        notifications: items(),
      });
      expect(screen.queryByRole("switch")).toBeNull();

      await rerender({ doNotDisturbLabel: "Do not disturb" });
      const toggle = screen.getByRole("switch", { name: "Do not disturb" });
      await user.click(toggle);
      expect(screen.getByTestId("dnd")).toHaveTextContent("true");
    });

    it("takes the toggle's state text from props", async () => {
      render(NotificationsPanel, {
        notifications: items(),
        doNotDisturbLabel: "Ne pas déranger",
        doNotDisturbOffText: "Désactivé",
        doNotDisturbOnText: "Activé",
      });

      expect(screen.getByText("Désactivé")).toBeInTheDocument();
      await user.click(screen.getByRole("switch"));
      expect(screen.getByText("Activé")).toBeInTheDocument();
      expect(screen.queryByText("Off")).toBeNull();
    });
  });

  describe("keyboard", () => {
    it("moves between row buttons with Up, Down, Home and End", async () => {
      render(NotificationsPanel, { notifications: items() });
      const rows = [
        "Build failed",
        "Deploy finished",
        "Invoice ready",
        "Old news",
      ].map(row);

      rows[0].focus();
      await user.keyboard("{ArrowDown}");
      expect(rows[1]).toHaveFocus();
      await user.keyboard("{End}");
      expect(rows[3]).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(rows[0]).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(rows[3]).toHaveFocus();
      await user.keyboard("{Home}");
      expect(rows[0]).toHaveFocus();
    });

    it("dismisses a dismissible row with Delete or Backspace, and ignores IME", async () => {
      render(NotificationsPanel, { notifications: items(), remove: false });
      const first = row("Build failed");
      const second = row("Deploy finished");

      first.focus();
      await user.keyboard("{Delete}");
      second.focus();
      await user.keyboard("{Backspace}");
      row("Old news").focus();
      await user.keyboard("{Delete}");
      first.focus();
      first.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Delete",
          isComposing: true,
          bubbles: true,
          cancelable: true,
        }),
      );

      expect(events()).toBe("dismiss:a,dismiss:b");
    });
  });

  describe("focus after a dismissal", () => {
    it("lands on the next row's dismiss button, then on the heading when empty", async () => {
      render(NotificationsPanel, {
        notifications: [items()[0], items()[1]],
      });

      screen
        .getByRole("button", { name: "Dismiss notification: Build failed" })
        .focus();
      await user.keyboard("{Enter}");
      await tick();
      expect(
        screen.getByRole("button", {
          name: "Dismiss notification: Deploy finished",
        }),
      ).toHaveFocus();

      await user.keyboard("{Enter}");
      await tick();
      expect(
        screen.getByRole("heading", { name: "Notifications" }),
      ).toHaveFocus();
    });

    it("keeps focus on the row button after Delete, moving to the next row", async () => {
      render(NotificationsPanel, { notifications: items() });

      row("Build failed").focus();
      await user.keyboard("{Delete}");
      await tick();

      expect(row("Deploy finished")).toHaveFocus();
    });

    it("moves to the last row when the last one is dismissed", async () => {
      render(NotificationsPanel, {
        notifications: [items()[0], items()[2]],
      });

      screen
        .getByRole("button", { name: "Dismiss notification: Invoice ready" })
        .focus();
      await user.keyboard("{Enter}");
      await tick();

      expect(
        screen.getByRole("button", {
          name: "Dismiss notification: Build failed",
        }),
      ).toHaveFocus();
    });

    it("leaves focus alone when the consumer keeps the row", async () => {
      render(NotificationsPanel, { notifications: items(), remove: false });

      const dismiss = screen.getByRole("button", {
        name: "Dismiss notification: Build failed",
      });
      dismiss.focus();
      await user.keyboard("{Enter}");
      await tick();

      expect(dismiss).toHaveFocus();
    });

    it("sends focus to the heading after Dismiss all", async () => {
      render(NotificationsPanel, { notifications: items() });

      screen.getByRole("button", { name: "Dismiss all" }).focus();
      await user.keyboard("{Enter}");
      await tick();

      expect(
        screen.getByRole("heading", { name: "Notifications" }),
      ).toHaveFocus();
    });

    it("does not take focus when it was elsewhere", async () => {
      render(NotificationsPanel, { notifications: items() });

      const outside = screen.getByTestId("outside");
      outside.focus();
      await user.click(
        screen.getByRole("button", {
          name: "Dismiss notification: Build failed",
        }),
      );
      outside.focus();
      await tick();

      expect(outside).toHaveFocus();
    });
  });

  describe("announcements", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("announces arrivals once, and stays silent on first render and removal", async () => {
      const { rerender } = render(NotificationsPanel, {
        notifications: items(),
      });
      const status = screen.getByRole("status");
      await vi.advanceTimersByTimeAsync(1000);
      expect(status.textContent).toBe("");

      await rerender({ notifications: items().slice(1) });
      await vi.advanceTimersByTimeAsync(1000);
      expect(status.textContent).toBe("");

      await rerender({
        notifications: [
          { id: "n1", title: "Backup done", timestamp: NOW },
          ...items().slice(1),
        ],
      });
      await vi.advanceTimersByTimeAsync(1000);
      expect(status).toHaveTextContent("Backup done");
    });

    it("reads a burst as one count, and turns off with announce={null}", async () => {
      const { rerender } = render(NotificationsPanel, { notifications: [] });
      const status = screen.getByRole("status");

      await rerender({
        notifications: [{ id: "n1", title: "One", timestamp: NOW }],
      });
      await rerender({
        notifications: [
          { id: "n1", title: "One", timestamp: NOW },
          { id: "n2", title: "Two", timestamp: NOW },
        ],
      });
      await vi.advanceTimersByTimeAsync(1000);
      expect(status).toHaveTextContent("2 new notifications");

      await rerender({ announce: null });
      await rerender({
        notifications: [
          { id: "n3", title: "Three", timestamp: NOW },
          { id: "n1", title: "One", timestamp: NOW },
          { id: "n2", title: "Two", timestamp: NOW },
        ],
      });
      await vi.advanceTimersByTimeAsync(1000);
      expect(status).toHaveTextContent("2 new notifications");
    });
  });

  describe("in a HeaderAction", () => {
    const panel = () => screen.queryByRole("region", { name: "Notifications" });
    // The outro is driven by Svelte's rAF loop, which lags in Svelte 3.
    const closed = () =>
      waitFor(() => expect(panel()).toBeNull(), { timeout: 5000 });
    const triggers = () => screen.getByTestId("triggers").textContent;

    it("closes the panel from a link row and from a link View all", async () => {
      const first = render(Host);
      await user.click(screen.getByRole("link", { name: /Open the report/ }));
      await closed();
      expect(triggers()).toBe("select");
      first.unmount();

      render(Host);
      await user.click(screen.getByRole("link", { name: "View all" }));
      await closed();
    });

    it("keeps the panel open for a button row", async () => {
      render(Host);

      await user.click(row("A button row"));
      expect(panel()).not.toBeNull();
      expect(triggers()).toBe("");
    });

    it("keeps the panel open when click:notification is prevented", async () => {
      render(Host, { prevent: true });

      await user.click(screen.getByRole("link", { name: /Open the report/ }));
      expect(panel()).not.toBeNull();
      expect(triggers()).toBe("");
    });
  });
});
