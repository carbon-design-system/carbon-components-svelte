import { render, screen } from "@testing-library/svelte";
import OverflowMenuCustomTrigger from "./OverflowMenu.customTrigger.test.svelte";

describe("OverflowMenu custom trigger", () => {
  it("marks the trigger only when the `menu` slot is filled", () => {
    render(OverflowMenuCustomTrigger);

    expect(screen.getByTestId("custom")).toHaveClass(
      "bx--overflow-menu--custom-trigger",
    );
    expect(screen.getByTestId("default")).not.toHaveClass(
      "bx--overflow-menu--custom-trigger",
    );
  });
});
