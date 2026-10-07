import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import AILabelSelection from "./AILabel.selection.test.svelte";

function label(testId: string) {
  const element = screen.getByTestId(testId).querySelector(".bx--ai-label");
  assert(element);
  return element;
}

describe("AILabel in selection controls, tags, and tiles", () => {
  it.each([
    ["checkbox", "bx--ai-label--mini"],
    ["checkbox-inline", "bx--ai-label--md"],
    ["checkbox-group", "bx--ai-label--mini"],
    ["radio", "bx--ai-label--mini"],
    ["radio-group", "bx--ai-label--mini"],
    ["tag", "bx--ai-label--sm"],
    ["tile", "bx--ai-label--xs"],
    ["clickable-tile", "bx--ai-label--xs"],
  ])("sizes the label in a %s", (testId, sizeClass) => {
    render(AILabelSelection);

    expect(label(testId)).toHaveClass(sizeClass);
  });

  it("forces the default kind in groups and the inline kind in tags", () => {
    render(AILabelSelection);

    expect(label("checkbox-group")).not.toHaveClass("bx--ai-label--inline");
    expect(label("tag")).toHaveClass("bx--ai-label--inline");
  });

  it.each(["checkbox", "radio"])("marks the %s wrapper", (testId) => {
    render(AILabelSelection);

    expect(
      label(testId).closest(
        `.bx--${testId === "radio" ? "radio-button" : "checkbox"}-wrapper`,
      ),
    ).toHaveClass(
      `bx--${testId === "radio" ? "radio-button" : "checkbox"}-wrapper--decorator`,
    );
  });

  it.each([
    "tile",
    "clickable-tile",
    "selectable-tile",
    "radio-tile",
    "expandable-tile",
  ])("gives the %s the AI surface", (testId) => {
    render(AILabelSelection);

    expect(screen.getByTestId(testId).querySelector(".bx--tile")).toHaveClass(
      "bx--tile--decorator",
      "bx--tile--ai-label",
    );
  });

  it.each([
    "clickable-tile",
    "selectable-tile",
    "radio-tile",
    "expandable-tile",
  ])("keeps the label outside the interactive %s", (testId) => {
    render(AILabelSelection);

    const tile = screen.getByTestId(testId).querySelector(".bx--tile");
    assert(tile);
    expect(tile.contains(label(testId))).toBe(false);
    expect(
      label(testId).closest(".bx--tile__wrapper--decorator"),
    ).not.toBeNull();
  });

  it("does not select the tile when the label opens", async () => {
    render(AILabelSelection);

    const host = screen.getByTestId("selectable-tile");
    await user.click(
      within(host).getByRole("button", { name: "AI Show information" }),
    );

    expect(screen.getByTestId("selected")).toHaveTextContent("false");
    expect(within(host).getByRole("checkbox")).toHaveAccessibleName("Plan");
  });

  it("leaves tiles without a decorator unwrapped", () => {
    render(AILabelSelection);

    const host = screen.getByTestId("plain-tile");
    expect(host.querySelector(".bx--tile__wrapper--decorator")).toBeNull();
    expect(host.querySelector(".bx--tile")).not.toHaveClass(
      "bx--tile--decorator",
    );
  });
});
