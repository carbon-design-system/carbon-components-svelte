import { render } from "@testing-library/svelte";
import Stack from "./Stack.as.test.svelte";

describe("Stack as", () => {
  it("renders through tag by default", () => {
    const { container } = render(Stack);
    const stack = container.querySelector("div.bx--stack");
    expect(stack).toHaveClass("bx--stack", "bx--stack-vertical");
  });

  it("renders as a custom element using the as prop", () => {
    const { container } = render(Stack, { props: { as: true } });
    const header = container.querySelector("header");
    expect(header).toHaveClass("bx--stack");
    expect(container.querySelector("div.bx--stack")).toBeNull();
  });

  it("passes computed classes and rest props to the custom element", () => {
    const { container } = render(Stack, {
      props: {
        as: true,
        orientation: "horizontal",
        gap: 5,
        "data-testid": "custom-header",
        "aria-label": "Custom header stack",
      },
    });
    const header = container.querySelector("[data-testid='custom-header']");
    expect(header).toHaveClass(
      "bx--stack",
      "bx--stack-horizontal",
      "bx--stack-scale-5",
    );
    expect(header).toHaveAttribute("aria-label", "Custom header stack");
  });

  it("applies a custom gap value as an inline style, not a scale class", () => {
    const { container } = render(Stack, {
      props: { as: true, gap: "22px" },
    });
    const header = container.querySelector("header");
    expect(header).toHaveStyle({ gap: "22px" });
    for (let gap = 1; gap <= 13; gap++) {
      expect(header).not.toHaveClass(`bx--stack-scale-${gap}`);
    }
  });

  it("merges a caller style with a custom gap value", () => {
    const { container } = render(Stack, {
      props: { gap: "22px", style: "color: red" },
    });
    const stack = container.querySelector("div.bx--stack");
    expect(stack).toHaveStyle({ gap: "22px", color: "rgb(255, 0, 0)" });
  });

  it("omits the style attribute when there is no custom gap or caller style", () => {
    const { container } = render(Stack, { props: { gap: 3 } });
    const stack = container.querySelector("div.bx--stack");
    expect(stack).not.toHaveAttribute("style");
  });
});
