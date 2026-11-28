import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { stubStuckObserver } from "../utils/stuck-observer";
import ToolbarStuck from "./ToolbarStuck.test.svelte";

describe("Toolbar stuck", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("binds `stuck` and sets the stuck class while the toolbar is stuck", async () => {
    const setStuck = stubStuckObserver();
    render(ToolbarStuck);
    const toolbar = screen.getByTestId("toolbar");
    expect(toolbar).not.toHaveClass("bx--table-toolbar--stuck");

    setStuck(toolbar, true);
    await tick();
    expect(toolbar).toHaveClass("bx--table-toolbar--stuck");
    expect(screen.getByTestId("stuck")).toHaveTextContent("true");

    setStuck(toolbar, false);
    await tick();
    expect(toolbar).not.toHaveClass("bx--table-toolbar--stuck");
    expect(screen.getByTestId("stuck")).toHaveTextContent("false");
  });

  it("lets go when `sticky` turns off", async () => {
    const setStuck = stubStuckObserver();
    const { rerender } = render(ToolbarStuck);
    const toolbar = screen.getByTestId("toolbar");
    setStuck(toolbar, true);
    await tick();

    await rerender({ sticky: false });
    expect(toolbar).not.toHaveClass("bx--table-toolbar--stuck");
    expect(screen.getByTestId("stuck")).toHaveTextContent("false");
    expect(document.querySelector("[data-ccs-sticky-sentinel]")).toBeNull();
  });

  it("adds no sentinel unless sticky", () => {
    stubStuckObserver();
    render(ToolbarStuck, { sticky: false });

    expect(document.querySelector("[data-ccs-sticky-sentinel]")).toBeNull();
  });
});
