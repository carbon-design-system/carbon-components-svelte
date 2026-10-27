import { render, screen } from "@testing-library/svelte";
import HeaderUtilities from "carbon-components-svelte/UIShell/HeaderUtilities.svelte";

describe("HeaderUtilities", () => {
  it("forwards rest props such as class and style to the container", () => {
    render(HeaderUtilities, {
      props: {
        "data-testid": "utilities",
        class: "custom",
        style: "gap: 4px",
      },
    });

    const utilities = screen.getByTestId("utilities");
    expect(utilities).toHaveClass("bx--header__global", "custom");
    expect(utilities.style.gap).toBe("4px");
  });
});
