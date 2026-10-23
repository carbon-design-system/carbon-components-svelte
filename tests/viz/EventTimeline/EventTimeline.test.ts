import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import EventTimeline from "./EventTimeline.test.svelte";

const table = () => screen.getByRole("table", { name: "Release events" });
const marks = () =>
  Array.from(table().querySelectorAll<HTMLElement>(".bx--viz-timeline__event"));

describe("EventTimeline", () => {
  it("places a mark per event on one lane, from the first to the last", () => {
    render(EventTimeline);

    expect(marks()).toHaveLength(4);
    expect(
      marks().map((mark) => mark.style.getPropertyValue("--bx-viz-start")),
    ).toEqual(["0", "25", "50", "100"]);
    expect(marks()[1].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-warning)",
    );
    // One lane: its header is present for the table but not shown.
    const header = within(table()).getByRole("rowheader");
    expect(header).toHaveTextContent("Events");
    expect(header.querySelector(".bx--visually-hidden")).not.toBeNull();
  });

  it("tells assistive technology each event's kind, label, and time", () => {
    render(EventTimeline);

    expect(marks()[1]).toHaveTextContent(
      /^alert, Latency high, Jan 1, 2026, 3:00 AM$/,
    );
    expect(marks()[1]).toHaveAttribute(
      "title",
      "alert, Latency high, Jan 1, 2026, 3:00 AM",
    );
  });

  it("lays events out by row when one is given", () => {
    render(EventTimeline, { withRows: true });

    expect(
      within(table())
        .getAllByRole("rowheader")
        .map((th) => th.textContent?.trim()),
    ).toEqual(["prod", "staging"]);
    expect(marks()).toHaveLength(4);
  });

  it("reports hover with the event and its datum", async () => {
    const onhover = vi.fn();
    render(EventTimeline, { onhover });

    await fireEvent.mouseEnter(marks()[2]);
    expect(onhover).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: "rollback",
        label: "v1.3.9",
        row: "Events",
        index: 2,
      }),
    );
    await fireEvent.mouseLeave(marks()[2]);
    expect(onhover).toHaveBeenLastCalledWith(null);
  });

  it("is a set of toggles with one tab stop when selectable", async () => {
    const onselect = vi.fn();
    render(EventTimeline, { selectable: true, onselect });

    const buttons = within(table()).getAllByRole("button");
    expect(buttons).toHaveLength(4);
    expect(buttons.map((button) => button.tabIndex)).toEqual([0, -1, -1, -1]);
    expect(buttons[0]).toHaveAccessibleName(
      "deploy, v1.4.0, Jan 1, 2026, 12:00 AM",
    );

    buttons[0].focus();
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onselect).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.objectContaining({ kind: "alert", index: 1 }),
      }),
    );
    expect(screen.getByTestId("selected")).toHaveTextContent("Events/1");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });
});
