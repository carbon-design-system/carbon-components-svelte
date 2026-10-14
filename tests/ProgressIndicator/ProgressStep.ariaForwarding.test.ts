import { render, screen } from "@testing-library/svelte";
import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";

describe("ProgressStep aria forwarding", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div id="aria-refs"><span id="extra-help">Extra help</span><span id="external-name">External name</span></div>',
    );
  });

  afterEach(() => {
    document.getElementById("aria-refs")?.remove();
  });

  it("places a consumer aria-describedby on the step button", () => {
    const { container } = render(ProgressStep, {
      props: { label: "Account", "aria-describedby": "extra-help" },
    });

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-describedby", "extra-help");
    expect(button).toHaveAccessibleDescription("Extra help");
    expect(container.querySelector("li")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the step button with a consumer aria-labelledby", () => {
    const { container } = render(ProgressStep, {
      props: { label: "Account", "aria-labelledby": "external-name" },
    });

    expect(
      screen.getByRole("button", { name: "External name" }),
    ).toBeInTheDocument();
    expect(container.querySelector("li")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("names the step button with a consumer aria-label", () => {
    const { container } = render(ProgressStep, {
      props: { label: "Account", "aria-label": "Consumer label" },
    });

    expect(
      screen.getByRole("button", { name: "Consumer label" }),
    ).toBeInTheDocument();
    expect(container.querySelector("li")).not.toHaveAttribute("aria-label");
  });
});
