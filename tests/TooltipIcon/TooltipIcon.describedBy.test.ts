import { render, screen } from "@testing-library/svelte";
import TooltipIcon from "carbon-components-svelte/TooltipIcon/TooltipIcon.svelte";

describe("TooltipIcon aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(TooltipIcon, {
      props: { tooltipText: "More info", "aria-describedby": "extra-help" },
    });

    const field = screen.getByRole("button");
    expect(field).toHaveAccessibleDescription("More info");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
