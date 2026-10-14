import { render, screen } from "@testing-library/svelte";
import Disclosure from "carbon-components-svelte/Disclosure/Disclosure.svelte";

describe("Disclosure aria forwarding", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="aria-refs"><span id="extra-help">Extra help</span><span id="external-name">External name</span></div>',
    );
  });

  afterEach(() => {
    document.getElementById("aria-refs")?.remove();
  });

  it("places a consumer aria-describedby on the trigger button", () => {
    const { container } = render(Disclosure, {
      props: { summary: "Details", "aria-describedby": "extra-help" },
    });

    const button = screen.getByRole("button", { name: "Details" });
    expect(button).toHaveAttribute("aria-describedby", "extra-help");
    expect(button).toHaveAccessibleDescription("Extra help");
    expect(container.querySelector(".bx--disclosure")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the trigger button with a consumer aria-labelledby", () => {
    const { container } = render(Disclosure, {
      props: { summary: "Details", "aria-labelledby": "external-name" },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".bx--disclosure")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("names the trigger button with a consumer aria-label", () => {
    const { container } = render(Disclosure, {
      props: { summary: "Details", "aria-label": "Consumer label" },
    });

    expect(
      screen.getByRole("button", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(container.querySelector(".bx--disclosure")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
