import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import Stack from "./Stack.test.svelte";

describe("Stack", () => {
  it.each(Array.from({ length: 13 }, (_, i) => i + 1))(
    "should render with gap scale %i",
    (gap) => {
      render(Stack, { props: { gap } });

      expect(screen.getByTestId("stack")).toHaveClass(
        "bx--stack",
        `bx--stack-scale-${gap}`,
      );
    },
  );

  it("should apply vertical orientation class by default", () => {
    render(Stack, { props: { gap: 1 } });

    expect(screen.getByTestId("stack")).toHaveClass("bx--stack-vertical");
  });

  it.each([1, 5, 13] as const)(
    "should apply horizontal orientation class at gap %i",
    (gap) => {
      render(Stack, { props: { orientation: "horizontal", gap } });

      expect(screen.getByTestId("stack")).toHaveClass(
        "bx--stack",
        "bx--stack-horizontal",
      );
    },
  );

  it.each(["200px", "1.5rem"])(
    "should apply inline gap style for custom string value %s",
    (gap) => {
      render(Stack, { props: { gap } });

      const stack = screen.getByTestId("stack");
      expect(stack).toHaveClass("bx--stack");
      expectInlineStyle(stack, { gap });
      expect(stack.className).not.toMatch(/bx--stack-scale-/);
    },
  );

  it.each(["ul", "section"] as const)(
    "should render with custom tag element %s",
    (tag) => {
      render(Stack, { props: { tag, gap: 3 } });

      const stack = screen.getByTestId("stack");
      expect(stack.tagName).toBe(tag.toUpperCase());
      expect(stack).toHaveClass("bx--stack");
    },
  );

  it("should apply inline class only when inline is true", async () => {
    const { rerender } = render(Stack, { props: { gap: 1 } });
    expect(screen.getByTestId("stack")).not.toHaveClass("bx--stack-inline");

    await rerender({ inline: true });
    expect(screen.getByTestId("stack")).toHaveClass(
      "bx--stack",
      "bx--stack-inline",
      "bx--stack-vertical",
    );
  });

  it.each([
    [
      "wrap",
      "horizontal",
      ["bx--stack-horizontal", "bx--stack-wrap"],
      ["bx--stack-wrap-reverse"],
    ],
    [
      "wrap-reverse",
      "horizontal",
      ["bx--stack-wrap-reverse"],
      ["bx--stack-wrap"],
    ],
    ["wrap", "vertical", ["bx--stack-vertical", "bx--stack-wrap"], []],
  ] as const)(
    "should apply the %s class on a %s stack, and none by default",
    async (wrap, orientation, present, absent) => {
      const { rerender } = render(Stack, { props: { orientation, gap: 3 } });
      expect(screen.getByTestId("stack")).not.toHaveClass(
        "bx--stack-wrap",
        "bx--stack-wrap-reverse",
      );

      await rerender({ wrap });
      const stack = screen.getByTestId("stack");
      expect(stack).toHaveClass(...present);
      for (const className of absent) {
        expect(stack).not.toHaveClass(className);
      }
    },
  );

  it.each([
    ["align", "start", "bx--stack-align-start"],
    ["align", "center", "bx--stack-align-center"],
    ["align", "end", "bx--stack-align-end"],
    ["align", "baseline", "bx--stack-align-baseline"],
    ["justify", "center", "bx--stack-justify-center"],
    ["justify", "end", "bx--stack-justify-end"],
    ["justify", "space-between", "bx--stack-justify-space-between"],
    ["justify", "space-around", "bx--stack-justify-space-around"],
    ["justify", "space-evenly", "bx--stack-justify-space-evenly"],
  ] as const)("should map %s %s to its class", (prop, value, className) => {
    render(Stack, { props: { [prop]: value } });

    const stack = screen.getByTestId("stack");
    expect(stack).toHaveClass(className);
    // Only the requested value's class is emitted.
    expect(
      stack.className.match(new RegExp(`bx--stack-${prop}-`, "g")),
    ).toHaveLength(1);
  });

  it("should emit no align class for the default stretch", () => {
    render(Stack, { props: { align: "stretch" } });

    expect(screen.getByTestId("stack").className).not.toMatch(
      /bx--stack-align-/,
    );
  });

  it("should omit gap class when gap is 0", () => {
    render(Stack, { props: { gap: 0 } });

    const stack = screen.getByTestId("stack");
    expect(stack).toHaveClass("bx--stack", "bx--stack-vertical");
    expect(stack.className).not.toMatch(/bx--stack-scale-/);
  });
});
