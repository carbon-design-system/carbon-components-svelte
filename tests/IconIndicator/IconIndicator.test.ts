import { render, screen } from "@testing-library/svelte";
import IconIndicator from "./IconIndicator.test.svelte";

describe("IconIndicator", () => {
  it("renders all kind variants with the correct icon class", () => {
    render(IconIndicator);

    const kinds = [
      "failed",
      "caution-major",
      "caution-minor",
      "undefined",
      "succeeded",
      "normal",
      "in-progress",
      "incomplete",
      "not-started",
      "pending",
      "unknown",
      "informative",
    ];

    for (const kind of kinds) {
      const indicator = screen.getByText(kind);
      expect(indicator).toHaveClass("bx--icon-indicator");
      expect(indicator.querySelector("svg")).toHaveClass(
        `bx--icon-indicator--${kind}`,
      );
    }
  });

  it("defaults to a size of 16", () => {
    render(IconIndicator);

    const indicator = screen.getByText("failed");
    expect(indicator).not.toHaveClass("bx--icon-indicator--20");
    expect(indicator.querySelector("svg")).toHaveAttribute("width", "16");
  });

  it("renders the 20px size modifier", () => {
    render(IconIndicator);

    const indicator = screen.getByText("size 20");
    expect(indicator).toHaveClass("bx--icon-indicator--20");
    expect(indicator.querySelector("svg")).toHaveAttribute("width", "20");
  });

  it("forwards additional attributes to the wrapper", () => {
    render(IconIndicator);

    const indicator = screen.getByTestId("attr-test");
    expect(indicator).toHaveClass("bx--icon-indicator", "custom-class");
  });

  it("overrides the label with labelChildren", () => {
    render(IconIndicator);

    const indicator = screen.getByTestId("label-children-test");
    expect(screen.getByText("Custom label content")).toBeInTheDocument();
    expect(indicator).not.toHaveTextContent("Default label");
  });
});
