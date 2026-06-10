import { render, screen } from "@testing-library/svelte";
import { truncate } from "../../src/Truncate/truncate.js";
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

    it("should truncate multiple lines when lines > 1", () => {
      render(Truncate, { props: { lines: 3 } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass("bx--text-truncate--multiline");
      expect(element).not.toHaveClass("bx--text-truncate--end");
      expect(element.style.getPropertyValue("--ccs-truncate-lines")).toBe("3");
    });

    it("should ignore clamp direction when multiline", () => {
      render(Truncate, { props: { clamp: "front", lines: 2 } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass("bx--text-truncate--multiline");
      expect(element).not.toHaveClass("bx--text-truncate--front");
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

    it("should truncate multiple lines when lines > 1", () => {
      render(TruncateAction, { props: { lines: 3 } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass("bx--text-truncate--multiline");
      expect(element).not.toHaveClass("bx--text-truncate--end");
      expect(element.style.getPropertyValue("--ccs-truncate-lines")).toBe("3");
    });

    it("should toggle between single-line and multiline on update", () => {
      const node = document.createElement("p");
      const { update } = truncate(node, { lines: 3 });
      expect(node).toHaveClass("bx--text-truncate--multiline");
      expect(node.style.getPropertyValue("--ccs-truncate-lines")).toBe("3");

      update({ clamp: "front" });
      expect(node).toHaveClass("bx--text-truncate--front");
      expect(node).not.toHaveClass("bx--text-truncate--multiline");
      expect(node.style.getPropertyValue("--ccs-truncate-lines")).toBe("");
    });

    it("update() with no arguments does not throw (options optional guard)", () => {
      const node = document.createElement("p");
      const { update } = truncate(node);
      expect(() => update()).not.toThrow();
      expect(() => update(undefined)).not.toThrow();
    });
  });
});
