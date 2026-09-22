import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import StateTimeline from "./StateTimeline.test.svelte";

const table = () => screen.getByRole("table", { name: "Service health" });
const segments = () =>
  Array.from(
    table().querySelectorAll<HTMLElement>(".bx--viz-timeline__segment"),
  );

describe("StateTimeline", () => {
  it("is a captioned table with a row per entity and a span per state", () => {
    render(StateTimeline);

    expect(
      within(table())
        .getAllByRole("rowheader")
        .map((th) => th.textContent),
    ).toEqual(["api", "worker"]);
    expect(segments()).toHaveLength(4);
    expect(segments()[1].style.getPropertyValue("--bx-viz-start")).toBe("50");
    expect(segments()[1].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-error)",
    );
  });

  it("tells assistive technology each span's state, times, and length", () => {
    render(StateTimeline);

    expect(segments()[1]).toHaveTextContent(
      /^down, Jan 1, 2026, 6:00 AM to Jan 1, 2026, 7:00 AM, 1h$/,
    );
    expect(segments()[1]).toHaveAttribute(
      "title",
      expect.stringContaining("1h"),
    );
  });

  it("labels the time axis and lists the states", () => {
    render(StateTimeline);

    const ticks = Array.from(
      table().querySelectorAll(".bx--viz-timeline__tick"),
    ).map((tick) => tick.textContent?.trim());
    expect(ticks.length).toBeGreaterThan(2);
    expect(ticks[0]).toMatch(/12\s?AM/);
    expect(
      Array.from(
        document.querySelectorAll(".bx--viz-treemap__legend-item"),
      ).map((item) => item.textContent?.trim()),
    ).toEqual(["ok", "down", "degraded"]);
  });

  it("fires hover, and renders no buttons unless selectable", async () => {
    const onhover = vi.fn();
    render(StateTimeline, { onhover });

    expect(within(table()).queryAllByRole("button")).toEqual([]);
    await user.hover(segments()[1]);
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({ row: "api", state: "down", index: 1 }),
    );
  });

  it("selects a span with one tab stop and arrow keys", async () => {
    const onselect = vi.fn();
    render(StateTimeline, { selectable: true, onselect });

    const buttons = within(table()).getAllByRole("button");
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(buttons[1]).toHaveAccessibleName(/^down, /);

    buttons[0].focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("api/1");
    expect(onselect.mock.calls[0][0]).toMatchObject({
      segment: { state: "down", duration: 3_600_000 },
    });
  });
});
