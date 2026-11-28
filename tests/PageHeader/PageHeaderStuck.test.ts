import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { stubStuckObserver } from "../utils/stuck-observer";
import PageHeaderStuck from "./PageHeaderStuck.test.svelte";

describe("PageHeader stuck", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("binds `stuck` and sets the stuck class while the header is stuck", async () => {
    const setStuck = stubStuckObserver();
    render(PageHeaderStuck);
    const header = screen.getByTestId("header");

    setStuck(header, true);
    await tick();
    expect(header).toHaveClass("bx--page-header--stuck");
    expect(screen.getByTestId("stuck")).toHaveTextContent("true");

    setStuck(header, false);
    await tick();
    expect(header).not.toHaveClass("bx--page-header--stuck");
    expect(screen.getByTestId("stuck")).toHaveTextContent("false");
  });

  it("lets go when `sticky` turns off", async () => {
    const setStuck = stubStuckObserver();
    const { rerender } = render(PageHeaderStuck);
    const header = screen.getByTestId("header");
    setStuck(header, true);
    await tick();

    await rerender({ sticky: false });
    expect(header).not.toHaveClass("bx--page-header--stuck");
    expect(screen.getByTestId("stuck")).toHaveTextContent("false");
    expect(document.querySelector("[data-ccs-sticky-sentinel]")).toBeNull();
  });
});
