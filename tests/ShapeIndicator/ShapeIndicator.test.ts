import { render, screen } from "@testing-library/svelte";
import ShapeIndicator from "./ShapeIndicator.test.svelte";

describe("ShapeIndicator", () => {
  it("renders all kind variants with the correct shape class", () => {
    render(ShapeIndicator);

    const kinds = [
      "failed",
      "critical",
      "high",
      "medium",
      "low",
      "cautious",
      "undefined",
      "stable",
      "informative",
      "incomplete",
      "draft",
    ];

    for (const kind of kinds) {
      const indicator = screen.getByText(kind);
      expect(indicator).toHaveClass("bx--shape-indicator");
      expect(indicator.querySelector("svg")).toHaveClass(
        `bx--shape-indicator--${kind}`,
      );
    }
  });

  it("defaults to a text size of 12", () => {
    render(ShapeIndicator);

    const indicator = screen.getByText("failed");
    expect(indicator).not.toHaveClass("bx--shape-indicator--14");
  });

  it("renders the 14px text size modifier", () => {
    render(ShapeIndicator);

    const indicator = screen.getByText("text size 14");
    expect(indicator).toHaveClass("bx--shape-indicator--14");
  });

  it("forwards additional attributes to the wrapper", () => {
    render(ShapeIndicator);

    const indicator = screen.getByTestId("attr-test");
    expect(indicator).toHaveClass("bx--shape-indicator", "custom-class");
  });

  it("overrides the label with labelChildren", () => {
    render(ShapeIndicator);

    const indicator = screen.getByTestId("label-children-test");
    expect(screen.getByText("Custom label content")).toBeInTheDocument();
    expect(indicator).not.toHaveTextContent("Default label");
  });
});
