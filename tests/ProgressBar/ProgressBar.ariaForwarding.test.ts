import { render, screen } from "@testing-library/svelte";
import ProgressBar from "carbon-components-svelte/ProgressBar/ProgressBar.svelte";

describe("ProgressBar aria forwarding", () => {
  beforeEach(() => {
    document.body.insertAdjacentHTML(
      "beforeend",
      '<span id="extra-help">Extra help</span><span id="ext-label">External label</span>',
    );
  });

  afterEach(() => {
    document.getElementById("extra-help")?.remove();
    document.getElementById("ext-label")?.remove();
  });

  it("joins a consumer aria-describedby after the helper text on the progressbar", () => {
    const { container } = render(ProgressBar, {
      props: {
        labelText: "Upload",
        helperText: "Helper",
        value: 40,
        "aria-describedby": "extra-help",
      },
    });

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
    expect(progressbar).toHaveAccessibleDescription("Helper Extra help");
    expect(container.querySelector(".bx--progress-bar")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("names the progressbar from a consumer aria-labelledby", () => {
    const { container } = render(ProgressBar, {
      props: { labelText: "Upload", "aria-labelledby": "ext-label" },
    });

    expect(screen.getByRole("progressbar")).toHaveAccessibleName(
      "External label",
    );
    expect(container.querySelector(".bx--progress-bar")).not.toHaveAttribute(
      "aria-labelledby",
    );
  });

  it("names the progressbar from a consumer aria-label", () => {
    const { container } = render(ProgressBar, {
      props: { labelText: "Upload", "aria-label": "Custom" },
    });

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAccessibleName("Custom");
    expect(progressbar).not.toHaveAttribute("aria-labelledby");
    expect(container.querySelector(".bx--progress-bar")).not.toHaveAttribute(
      "aria-label",
    );
  });
});
