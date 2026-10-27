// @vitest-environment node
import NotificationsPanel from "carbon-components-svelte/NotificationsPanel/NotificationsPanel.svelte";
import { renderSSR } from "../utils/ssr";

const now = Date.UTC(2026, 9, 27, 15, 0, 0);
const HOUR = 3_600_000;

describe("NotificationsPanel server render", () => {
  it("renders groups, rows and relative times from now and timeZone", () => {
    const { document } = renderSSR(NotificationsPanel, {
      notifications: [
        { id: "a", title: "Build failed", timestamp: now - HOUR, unread: true },
        { id: "b", title: "Invoice", timestamp: now - 30 * HOUR },
      ],
      now,
      locale: "en",
      timeZone: "UTC",
      viewAllText: "View all",
    });

    expect(
      Array.from(document.querySelectorAll("h3"), (h) => h.textContent?.trim()),
    ).toEqual(["Today", "Yesterday"]);
    expect(document.querySelectorAll("li")).toHaveLength(2);
    expect(document.querySelector("time")?.textContent).toBe("1 hr. ago");
    expect(document.querySelector("time")?.getAttribute("title")).toContain(
      "2026",
    );
    expect(document.body.textContent).toContain("View all");
  });

  it("renders the empty state without printing undefined or NaN", () => {
    const { document } = renderSSR(NotificationsPanel, {});

    expect(document.body.textContent).toContain("You're all caught up");
    expect(document.body.textContent).not.toMatch(/undefined|NaN/);
  });
});
