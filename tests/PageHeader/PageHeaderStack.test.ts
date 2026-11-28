import { render, screen } from "@testing-library/svelte";
import { expectInlineStyle } from "../utils/inline-style";
import { rect } from "../utils/rect";
import PageHeaderStack from "./PageHeaderStack.test.svelte";

describe('PageHeader stickyOffset="stack"', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sticks below the Header, and a stacked Toolbar below it", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        return rect({ height: this.tagName === "HEADER" ? 120 : 48 });
      },
    );
    render(PageHeaderStack);
    const header = screen.getByTestId("header");
    const toolbar = screen.getByTestId("toolbar");

    // No scale class: the stack sets `top` after mount.
    expect(header.className).not.toMatch(/bx--box-top-/);
    await vi.waitFor(() => expectInlineStyle(header, { top: "48px" }));
    await vi.waitFor(() => expectInlineStyle(toolbar, { top: "168px" }));
    expect(
      document.documentElement.style.getPropertyValue("--ccs-sticky-offset"),
    ).toBe("216px");
  });
});
