import { render, screen } from "@testing-library/svelte";
import ActionSetSticky from "./ActionSet.sticky.test.svelte";

describe("ActionSet sticky", () => {
  it("should apply the sticky class when sticky is set", () => {
    render(ActionSetSticky);

    expect(screen.getByTestId("action-set")).toHaveClass(
      "bx--action-set--sticky",
    );
  });
});
