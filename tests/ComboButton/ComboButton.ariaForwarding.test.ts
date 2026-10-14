import { render, screen } from "@testing-library/svelte";
import ComboButton from "carbon-components-svelte/ComboButton/ComboButton.svelte";

describe("ComboButton aria forwarding", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="aria-refs"><span id="extra-help">Extra help</span><span id="external-name">External name</span></div>',
    );
  });

  afterEach(() => {
    document.getElementById("aria-refs")?.remove();
  });

  it("places a consumer aria-describedby on the primary action", () => {
    const { container } = render(ComboButton, {
      props: { labelText: "Save", "aria-describedby": "extra-help" },
    });

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("aria-describedby", "extra-help");
    expect(button).toHaveAccessibleDescription("Extra help");
    expect(container.querySelector(".bx--combo-button")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the primary action with a consumer aria-labelledby", () => {
    const { container } = render(ComboButton, {
      props: { labelText: "Save", "aria-labelledby": "external-name" },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".bx--combo-button")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("names the primary action with a consumer aria-label, not the wrapper", () => {
    const { container } = render(ComboButton, {
      props: { labelText: "Save", "aria-label": "Consumer label" },
    });

    expect(
      screen.getByRole("button", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".bx--combo-button")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
