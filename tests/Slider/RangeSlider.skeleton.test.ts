import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import RangeSliderSkeleton from "./RangeSliderSkeleton.test.svelte";

describe("RangeSliderSkeleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not forward click but forwards mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(RangeSliderSkeleton);

    const skeleton = screen.getByTestId("range-slider-skeleton");
    expect(skeleton).toBeInTheDocument();

    // Click should not trigger console.log
    await user.click(skeleton);
    expect(consoleLog).not.toHaveBeenCalledWith("click");

    // But mouse events should still fire
    await user.hover(skeleton);
    expect(consoleLog).toHaveBeenCalledWith("mouseenter");
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(skeleton);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });
});
