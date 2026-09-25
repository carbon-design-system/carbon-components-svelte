import { render, screen } from "@testing-library/svelte";
import TabContentFlush from "./TabContentFlush.test.svelte";

describe("TabContent flush", () => {
  it("applies the flush modifier only when `flush` is set", () => {
    render(TabContentFlush);

    expect(screen.getByText("Flush panel")).toHaveClass(
      "bx--tab-content",
      "bx--tab-content--flush",
    );
    expect(
      screen.getByText("Default panel", { selector: "[role=tabpanel]" }),
    ).not.toHaveClass("bx--tab-content--flush");
  });
});
