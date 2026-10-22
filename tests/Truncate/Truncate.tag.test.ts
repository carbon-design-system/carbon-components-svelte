import { render, screen } from "@testing-library/svelte";
import Truncate from "./Truncate.tag.test.svelte";

describe("Truncate tag", () => {
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
});
