// @vitest-environment node
import { renderSSR } from "../utils/ssr";
import PageHeaderStack from "./PageHeaderStack.test.svelte";
import PageHeaderStuck from "./PageHeaderStuck.test.svelte";

describe("sticky components on the server", () => {
  it("render no sentinel and aren't stuck", () => {
    const { document } = renderSSR(PageHeaderStuck);
    const header = document.querySelector("header.bx--page-header");

    expect(document.querySelector("[data-ccs-sticky-sentinel]")).toBeNull();
    expect(header).toHaveClass("bx--box-top-0");
    expect(header).not.toHaveClass("bx--page-header--stuck");
  });

  it('leave `top` to the browser for stickyOffset="stack"', () => {
    const { document } = renderSSR(PageHeaderStack);
    const header = document.querySelector("header.bx--page-header");
    const toolbar = document.querySelector(".bx--table-toolbar");

    expect(header?.className).not.toMatch(/bx--box-top-/);
    expect(toolbar?.getAttribute("style") ?? "").not.toMatch(/top/);
  });
});
