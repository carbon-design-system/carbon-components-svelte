import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { stubStuckObserver } from "../utils/stuck-observer";
import ActionSetStuck from "./ActionSetStuck.test.svelte";

describe("ActionSet stuck", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("binds `stuck` and sets the stuck class while the set is stuck", async () => {
    const setStuck = stubStuckObserver();
    render(ActionSetStuck);
    const set = screen.getByTestId("action-set");
    // A bottom-edge sentinel follows the set.
    expect(set.nextElementSibling).toHaveAttribute("data-ccs-sticky-sentinel");

    setStuck(set, true);
    await tick();
    expect(set).toHaveClass("bx--action-set--stuck");
    expect(screen.getByTestId("stuck")).toHaveTextContent("true");

    setStuck(set, false);
    await tick();
    expect(set).not.toHaveClass("bx--action-set--stuck");
  });

  it("doesn't count a sentinel inside the set as an action", async () => {
    stubStuckObserver();
    render(ActionSetStuck, { flex: true });
    const set = screen.getByTestId("action-set");
    await tick();

    expect(set.firstElementChild).toHaveAttribute("data-ccs-sticky-sentinel");
    expect(set).toHaveClass("bx--action-set--row-double");
  });
});
