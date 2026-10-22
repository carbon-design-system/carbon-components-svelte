import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushMacrotask } from "../utils/flush-macrotask";
import { user } from "../utils/user";
import ExpandableTileDetect from "./ExpandableTileDetect.test.svelte";

function chevronButton() {
  return screen.getByRole("button", { name: "View plan" });
}

describe("ExpandableTile interactive content", () => {
  it("points the tile button at the below-the-fold content", () => {
    const { container } = render(ExpandableTileDetect);

    const tile = screen.getByTestId("tile");
    expect(tile.tagName).toBe("BUTTON");
    expect(tile).toHaveAttribute("aria-controls", "detect-content");
    expect(container.querySelector("#detect-content")).toHaveClass(
      "bx--tile-content__below-the-fold",
    );
  });

  it.each(["link", "button", "input", "tabindex", "contenteditable"] as const)(
    "switches to the chevron button for a %s",
    async (content) => {
      render(ExpandableTileDetect, { content });
      await tick();

      const tile = screen.getByTestId("tile");
      expect(tile.tagName).toBe("DIV");
      expect(tile).toHaveClass("bx--tile--expandable--interactive");
      expect(tile).not.toHaveAttribute("aria-controls");
      expect(chevronButton()).toHaveAttribute(
        "aria-controls",
        "detect-content",
      );
    },
  );

  it.each(["text", "anchor", "hidden-input"] as const)(
    "keeps the tile button for %s content",
    async (content) => {
      render(ExpandableTileDetect, { content });
      await tick();

      expect(screen.getByTestId("tile").tagName).toBe("BUTTON");
    },
  );

  it("keeps the tile button when `hasInteractiveContent` is `false`", async () => {
    render(ExpandableTileDetect, {
      content: "link",
      hasInteractiveContent: false,
    });
    await tick();

    expect(screen.getByTestId("tile").tagName).toBe("BUTTON");
  });

  it("renders the div without interactive content when `hasInteractiveContent` is `true`", () => {
    render(ExpandableTileDetect, { hasInteractiveContent: true });

    expect(screen.getByTestId("tile").tagName).toBe("DIV");
  });

  it("switches when interactive content arrives later, keeping focus on the toggle", async () => {
    const { rerender } = render(ExpandableTileDetect);
    const tile = screen.getByTestId("tile");
    expect(tile.tagName).toBe("BUTTON");

    await user.tab();
    expect(tile).toHaveFocus();

    await rerender({ lateLink: true });
    await flushMacrotask();
    await tick();

    expect(screen.getByTestId("tile").tagName).toBe("DIV");
    expect(chevronButton()).toHaveFocus();
  });

  it("toggles from the chevron button after the switch", async () => {
    render(ExpandableTileDetect, { content: "link" });
    await tick();

    await user.click(chevronButton());
    expect(screen.getByTestId("tile")).toHaveClass("bx--tile--is-expanded");
  });
});
