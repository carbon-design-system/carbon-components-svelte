import { render, screen, within } from "@testing-library/svelte";
import TimelineComponent from "carbon-components-svelte/Timeline/Timeline.svelte";
import { user } from "../utils/user";
import Timeline from "./Timeline.test.svelte";
import TimelineInSection from "./TimelineInSection.test.svelte";

const at = (iso: string) => Date.parse(iso);

const items = [
  {
    id: "a",
    time: at("2026-11-05T10:00:00Z"),
    titleText: "Ordered",
    status: "success" as const,
  },
  {
    id: "b",
    time: at("2026-11-06T09:00:00Z"),
    titleText: "Shipped",
    descriptionText: "Left the warehouse.",
    status: "warning" as const,
  },
  { id: "c", titleText: "Delivered", status: "pending" as const },
];

const titles = () =>
  screen
    .getAllByRole("listitem")
    .filter((item) => item.classList.contains("bx--timeline__item"))
    .map((item) =>
      item.querySelector(".bx--timeline__title")?.textContent?.trim(),
    );

describe("Timeline", () => {
  it("renders an ordered list named by aria-label, one item per event", () => {
    render(Timeline, { items });

    const list = screen.getByRole("list", { name: "History" });
    expect(list.tagName).toBe("OL");
    expect(titles()).toEqual(["Ordered", "Shipped", "Delivered"]);
  });

  it("says the status in text and marks the step in progress", () => {
    render(Timeline, { items });

    const [ordered, shipped, delivered] = screen.getAllByRole("listitem");
    expect(ordered).toHaveTextContent("Success");
    expect(shipped).toHaveTextContent("Warning");
    expect(delivered).toHaveTextContent("In progress");
    expect(delivered).toHaveAttribute("aria-current", "step");
    expect(ordered).not.toHaveAttribute("aria-current");
  });

  it("writes the time in a time element and the age beside a recent one", () => {
    render(Timeline, { items });

    const [ordered, shipped] = screen.getAllByRole("listitem");
    const time = ordered.querySelector("time");
    expect(time).toHaveAttribute("datetime", "2026-11-05T10:00:00.000Z");
    // Engines differ on what joins the date and the time: a comma in V8, "at"
    // in Bun.
    expect(time).toHaveTextContent(/^Nov 5, 2026(,| at) 10:00 AM · yesterday$/);
    expect(shipped.querySelector("time")).toHaveTextContent("6 hours ago");
  });

  it("leaves out the age of an event older than relativeWithin", () => {
    render(Timeline, {
      items: [
        { id: "old", time: at("2026-09-01T10:00:00Z"), titleText: "Old" },
      ],
    });

    expect(screen.getByRole("listitem")).not.toHaveTextContent("ago");
  });

  it("sorts newest first on request", () => {
    render(Timeline, { items, order: "desc" });

    expect(titles()).toEqual(["Delivered", "Shipped", "Ordered"]);
  });

  it("takes the heading level from the Section it sits in", () => {
    const { unmount } = render(TimelineInSection, { level: 2 });
    expect(
      screen.getByRole("heading", { level: 3, name: "Today" }),
    ).toBeInTheDocument();
    unmount();

    const { unmount: second } = render(TimelineInSection, { level: 4 });
    expect(
      screen.getByRole("heading", { level: 5, name: "Today" }),
    ).toBeInTheDocument();
    second();

    render(TimelineInSection, { level: 4, headingLevel: 2 });
    expect(
      screen.getByRole("heading", { level: 2, name: "Today" }),
    ).toBeInTheDocument();
  });

  it("reads the browser's clock once mounted when no now is set", () => {
    vi.useFakeTimers({ now: at("2026-11-06T15:00:00Z"), toFake: ["Date"] });
    try {
      render(TimelineComponent, {
        items,
        groupBy: "day",
        now: undefined,
        locale: undefined,
        timeZone: "UTC",
      });

      expect(
        screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent),
      ).toEqual([
        expect.stringContaining("Yesterday"),
        expect.stringContaining("Today"),
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("nests each day's events under its heading", () => {
    render(Timeline, { items, groupBy: "day" });

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent?.trim())).toEqual([
      "Yesterday",
      "Today",
    ]);
    const today = headings[1].closest("li");
    expect(today).not.toBeNull();
    // The in-progress step has no time and joins the day before it.
    expect(
      within(today as HTMLElement)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual([
      expect.stringContaining("Shipped"),
      expect.stringContaining("Delivered"),
    ]);
    // Under a heading the time is the time of day.
    expect(
      within(today as HTMLElement).getByText(/9:00 AM/),
    ).toBeInTheDocument();
  });

  it("renders the content slot with the item and its source index", () => {
    render(Timeline, { items, withContent: true });

    expect(
      screen.getByRole("button", { name: "Details for b at 1" }),
    ).toBeInTheDocument();
    const contents = [...document.querySelectorAll(".bx--timeline__content")];
    // The other two are empty, so the stylesheet's `:empty` hides them.
    expect(contents.map((node) => node.textContent)).toEqual([
      "",
      "Details for b at 1",
      "",
    ]);
  });

  it("adds composed TimelineItems after the data ones", () => {
    render(Timeline, { items, withChildren: true });

    expect(titles().at(-1)).toBe("Composed");
  });

  describe("collapse", () => {
    it("hides the earlier events behind a button and shows them on click", async () => {
      render(Timeline, { items, limit: 1 });

      expect(titles()).toEqual(["Delivered"]);
      await user.click(
        screen.getByRole("button", { name: "Show 2 earlier events" }),
      );

      expect(titles()).toEqual(["Ordered", "Shipped", "Delivered"]);
      await user.click(
        screen.getByRole("button", { name: "Show fewer events" }),
      );
      expect(titles()).toEqual(["Delivered"]);
    });

    it("puts the button at the earlier end", () => {
      const { container, unmount } = render(Timeline, { items, limit: 1 });
      const asc = container.querySelector(".bx--timeline");
      expect(asc?.firstElementChild).toHaveClass("bx--timeline__more");
      unmount();

      const desc = render(Timeline, { items, limit: 1, order: "desc" });
      expect(
        desc.container.querySelector(".bx--timeline")?.lastElementChild,
      ).toHaveClass("bx--timeline__more");
    });

    it("shows no button when the events fit", () => {
      render(Timeline, { items, limit: 3 });

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("live", () => {
    // The shared announcer's region, not one inside the timeline.
    const spoken = () =>
      document.querySelector("[data-announcer] [role=status]")?.textContent ??
      "";

    it("stays silent for a static history and for the first render", async () => {
      const { container, rerender } = render(Timeline, { items });
      expect(container.querySelector("[role=status]")).toBeNull();

      await rerender({ items: [...items, { id: "d", titleText: "Added" }] });
      expect(spoken()).toBe("");
    });

    it("announces an event added after the first render", async () => {
      const { container, rerender } = render(Timeline, { items, live: true });
      expect(spoken()).toBe("");

      await rerender({
        items: [
          ...items,
          {
            id: "d",
            time: at("2026-11-06T14:00:00Z"),
            titleText: "Signed for",
          },
        ],
      });
      await vi.waitFor(() => expect(spoken()).toBe("New event: Signed for"));
      // The timeline has no live region of its own.
      expect(container.querySelector("[role=status]")).toBeNull();
    });

    it("speaks what liveDescription returns", async () => {
      const { rerender } = render(Timeline, {
        items,
        live: true,
        liveDescription: (added: readonly unknown[]) => `${added.length} neu`,
      });

      await rerender({ items: [...items, { id: "d" }, { id: "e" }] });
      await vi.waitFor(() => expect(spoken()).toBe("2 neu"));
    });
  });
});
