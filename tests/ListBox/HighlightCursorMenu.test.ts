import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import HighlightCursorMenu from "./HighlightCursorMenu.test.svelte";

const HIGHLIGHT = "bx--list-box__menu-item--highlighted";

describe("ListBoxMenu highlight cursor", () => {
  it("highlights only the option whose id matches highlightedId", async () => {
    const { rerender } = render(HighlightCursorMenu, {
      props: { highlightedId: "hl-a" },
    });
    await tick();

    expect(screen.getByText("Alpha").closest("[role='option']")).toHaveClass(
      HIGHLIGHT,
    );
    expect(screen.getByText("Beta").closest("[role='option']")).not.toHaveClass(
      HIGHLIGHT,
    );

    rerender({ highlightedId: "hl-b" });
    await tick();

    expect(
      screen.getByText("Alpha").closest("[role='option']"),
    ).not.toHaveClass(HIGHLIGHT);
    expect(screen.getByText("Beta").closest("[role='option']")).toHaveClass(
      HIGHLIGHT,
    );
  });

  it("keeps the highlight class on an active option after the cursor moves away", async () => {
    const { rerender } = render(HighlightCursorMenu, {
      props: { highlightedId: "hl-c" },
    });
    await tick();

    rerender({ highlightedId: "hl-a" });
    await tick();

    expect(screen.getByText("Gamma").closest("[role='option']")).toHaveClass(
      HIGHLIGHT,
    );
    expect(screen.getByText("Gamma").closest("[role='option']")).toHaveClass(
      "bx--list-box__menu-item--active",
    );
    expect(screen.getByText("Alpha").closest("[role='option']")).toHaveClass(
      HIGHLIGHT,
    );
  });
});
