import { render, screen } from "@testing-library/svelte";
import Truncate from "./Truncate.test.svelte";
import TruncateAction from "./TruncateAction.test.svelte";

describe("Truncate", () => {
  describe("component", () => {
    test.each([
      ["end", "bx--text-truncate--end"],
      ["front", "bx--text-truncate--front"],
    ] as const)("should support %s clamp", (clamp, expectedClass) => {
      render(Truncate, { props: { clamp } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass(expectedClass);
    });

    it("should render text content", () => {
      const text = "Custom text content";
      render(Truncate, { props: { text } });

      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it("should render as paragraph element", () => {
      render(Truncate);

      const element = screen.getByText(/This is a long text/);
      expect(element.tagName).toBe("P");
    });

    it("should default to end clamp", () => {
      render(Truncate);

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass("bx--text-truncate--end");
    });
  });

  describe("action", () => {
    test.each([
      ["end", "bx--text-truncate--end"],
      ["front", "bx--text-truncate--front"],
    ] as const)("should support %s clamp", (clamp, expectedClass) => {
      render(TruncateAction, { props: { clamp } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass(expectedClass);
    });

    test.each([
      ["h1", "H1"],
      ["h2", "H2"],
      ["h3", "H3"],
      ["h4", "H4"],
      ["p", "P"],
      ["span", "SPAN"],
    ] as const)("should work with %s element", (elementType, expectedTag) => {
      render(TruncateAction, { props: { element: elementType } });

      const element = screen.getByText(/This is a long text/);
      expect(element.tagName).toBe(expectedTag);
      expect(element).toHaveClass("bx--text-truncate--end");
    });

    it("should preserve existing classes", () => {
      render(TruncateAction, {
        props: {
          element: "p",
          text: "Test",
        },
      });

      const element = screen.getByText("Test");
      element.classList.add("custom-class");

      // Trigger update
      element.dispatchEvent(new Event("update"));

      expect(element).toHaveClass("custom-class");
      expect(element).toHaveClass("bx--text-truncate--end");
    });

    it("should default to end clamp", () => {
      render(TruncateAction);

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass("bx--text-truncate--end");
    });
  });
});
