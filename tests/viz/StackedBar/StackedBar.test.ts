import { render, screen, within } from "@testing-library/svelte";
import { user } from "../../utils/user";
import StackedBar from "./StackedBar.test.svelte";

const segments = (id: string) =>
  Array.from(
    screen
      .getByTestId(id)
      .querySelectorAll<HTMLElement>(".bx--viz-stacked-bar__segment"),
  );

describe("StackedBar", () => {
  it("names the image with the label and every share", () => {
    render(StackedBar);

    expect(
      screen.getByRole("img", {
        name: "Sessions, Desktop 50%, Mobile 30%, Tablet 15%, TV 5%",
      }),
    ).toBe(screen.getByTestId("basic"));
  });

  it("is decorative without a label or visible labels", () => {
    render(StackedBar);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
  });

  it("keeps visible labels readable when there is no accessible name", () => {
    render(StackedBar);

    const root = screen.getByTestId("labelled");
    expect(root).not.toHaveAttribute("aria-hidden");
    expect(root.querySelector(".bx--viz-stacked-bar__track")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      within(root)
        .getAllByRole("listitem")
        .map((item) => item.textContent?.replace(/\s+/g, " ").trim()),
    ).toEqual(["Desktop 50%", "Mobile 30%", "Tablet 15%", "TV 5%"]);
  });

  it("sizes each segment by its share and colors it from the palette", () => {
    render(StackedBar);

    const parts = segments("basic");
    expect(parts.map((s) => s.style.getPropertyValue("--bx-viz-pct"))).toEqual([
      "50",
      "30",
      "15",
      "5",
    ]);
    for (const part of parts) {
      expect(part.style.getPropertyValue("--bx-viz-color")).toMatch(
        /^var\(--cds-viz-/,
      );
    }
    expect(
      new Set(parts.map((s) => s.style.getPropertyValue("--bx-viz-color")))
        .size,
    ).toBe(4);
  });

  it("folds the tail into a neutral segment and writes formatted values", () => {
    render(StackedBar);

    const parts = segments("folded");
    expect(parts).toHaveLength(3);
    expect(parts[2].style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-neutral)",
    );
    expect(parts[2].style.getPropertyValue("--bx-viz-pct")).toBe("20");
    expect(screen.getByTestId("folded")).toHaveAccessibleName(
      "Folded, Desktop 50%, Mobile 30%, Other 20%",
    );
  });

  it("resolves per item colors and hides empty segments", () => {
    render(StackedBar);

    const parts = segments("colors");
    expect(
      parts.map((s) => s.style.getPropertyValue("--bx-viz-color")),
    ).toEqual(["var(--cds-viz-success)", "var(--cds-viz-cat-03)", "#da1e28"]);
    expect(parts[1]).toHaveClass("bx--viz-stacked-bar__segment--empty");
    expect(screen.getByTestId("colors")).toHaveClass("bx--viz-stacked-bar--sm");
  });

  it("renders no buttons unless selectable", () => {
    render(StackedBar);

    expect(
      within(screen.getByTestId("basic")).queryAllByRole("button"),
    ).toEqual([]);
  });

  it("selects a segment, binds the id, and clears on a second press", async () => {
    const onselect = vi.fn();
    render(StackedBar, { props: { onselect } });

    const group = screen.getByRole("group", { name: "Pick a device" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Desktop 50%",
      "Mobile 30%",
      "Tablet 15%",
      "TV 5%",
    ]);

    await user.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("selected")).toHaveTextContent("mobile");
    expect(group).toHaveClass("bx--viz-stacked-bar--has-selection");
    expect(onselect).toHaveBeenCalledTimes(1);
    expect(onselect.mock.calls[0][0]).toMatchObject({
      item: { id: "mobile" },
      index: 1,
      pct: 30,
    });

    await user.click(buttons[1]);
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("selected")).toHaveTextContent("");
  });

  it("has one tab stop and moves focus with the arrow keys", async () => {
    render(StackedBar);

    const buttons = within(screen.getByTestId("selectable")).getAllByRole(
      "button",
    );
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1]);

    buttons[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(buttons[1]).toHaveFocus();
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1]);

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected")).toHaveTextContent("mobile");
  });
});
