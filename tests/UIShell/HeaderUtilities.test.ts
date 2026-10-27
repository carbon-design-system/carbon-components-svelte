import { render, screen } from "@testing-library/svelte";
import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";

describe("HeaderUtilities", () => {
  it("forwards attributes to the container, so a style can reach the panel", () => {
    render(HeaderUtilities, {
      props: {
        "data-testid": "utilities",
        style: "--ccs-header-panel-width: 22rem",
      },
    });

    const utilities = screen.getByTestId("utilities");
    expect(utilities).toHaveClass("bx--header__global");
    expect(utilities.style.getPropertyValue("--ccs-header-panel-width")).toBe(
      "22rem",
    );
  });
});
