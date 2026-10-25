import { render, screen } from "@testing-library/svelte";
import { truncate } from "../../src/Truncate/truncate.js";
import { expectInlineStyle } from "../utils/inline-style";
import Truncate from "./Truncate.test.svelte";
import TruncateAction from "./TruncateAction.test.svelte";

describe("Truncate", () => {
  describe("component", () => {
    it("should support end clamp", () => {
      render(Truncate, { props: { clamp: "end" } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass("bx--text-truncate--end");
    });

    it("should isolate the text of a front clamp", () => {
      render(Truncate, { props: { clamp: "front" } });

      const text = screen.getByText(/This is a long text/);
      expect(text.tagName).toBe("BDI");
      expect(text.parentElement).toHaveClass("bx--text-truncate--front");
    });

    it("should truncate multiple lines when lines > 1", () => {
      render(Truncate, { props: { lines: 3 } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass("bx--text-truncate--multiline");
      expect(element).not.toHaveClass("bx--text-truncate--end");
      expect(element.style.getPropertyValue("--ccs-truncate-lines")).toBe("3");
    });

    it.each([
      ["button", "button"],
      ["ol", "a"],
    ] as const)("should pass type through to a %s", (tag, type) => {
      render(Truncate, { props: { tag, attrs: { type } } });

      const element = screen.getByText(/This is a long text/);
      expect(element.tagName).toBe(tag.toUpperCase());
      expect(element).toHaveAttribute("type", type);
      expect(element).toHaveClass("bx--text-truncate--end");
    });

    it("should default to a paragraph element", () => {
      render(Truncate);

      const element = screen.getByText(/This is a long text/);
      expect(element.tagName).toBe("P");
      expect(element).toHaveClass("bx--text-truncate--end");
    });

    it("should support multiline truncation on a custom tag", () => {
      render(Truncate, { props: { tag: "div", lines: 2 } });

      const element = screen.getByText(/This is a long text/);
      expect(element.tagName).toBe("DIV");
      expect(element).toHaveClass("bx--text-truncate--multiline");
      expect(element.style.getPropertyValue("--ccs-truncate-lines")).toBe("2");
    });

    it("should merge a consumer style with the lines variable", async () => {
      const { rerender } = render(Truncate, {
        props: { style: "color: red", lines: 3 },
      });
      const element = screen.getByText(/This is a long text/);
      expectInlineStyle(element, { "--ccs-truncate-lines": "3", color: "red" });

      await rerender({ lines: 1 });

      expectInlineStyle(element, { "--ccs-truncate-lines": "", color: "red" });
    });

    it("should ignore clamp direction when multiline", () => {
      render(Truncate, { props: { clamp: "front", lines: 2 } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass("bx--text-truncate--multiline");
      expect(element).not.toHaveClass("bx--text-truncate--front");
    });
  });

  describe("action", () => {
    it.each([
      ["end", "bx--text-truncate--end"],
      ["front", "bx--text-truncate--front"],
    ] as const)("should support %s clamp", (clamp, expectedClass) => {
      render(TruncateAction, { props: { clamp } });

      const element = screen.getByText(/This is a long text/);
      expect(element).toHaveClass(expectedClass);
    });

    it("should work with a span element", () => {
      render(TruncateAction, { props: { element: "span" } });

      const element = screen.getByText(/This is a long text/);
      expect(element.tagName).toBe("SPAN");
      expect(element).toHaveClass("bx--text-truncate--end");
    });

    it("should preserve existing classes", () => {
      const node = document.createElement("p");
      node.classList.add("custom-class");
      const { update } = truncate(node, { clamp: "end" });
      expect(node).toHaveClass("custom-class");
      expect(node).toHaveClass("bx--text-truncate--end");

      node.classList.add("added-later");
      update({ clamp: "front" });

      expect(node).toHaveClass("custom-class");
      expect(node).toHaveClass("added-later");
      expect(node).toHaveClass("bx--text-truncate--front");
      expect(node).not.toHaveClass("bx--text-truncate--end");
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
