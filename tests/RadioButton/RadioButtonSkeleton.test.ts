import { render } from "@testing-library/svelte";
import { user } from "../utils/user";
import RadioButtonSkeletonEvents from "./RadioButtonSkeleton.events.test.svelte";

describe("RadioButtonSkeleton", () => {
  it("does not forward click but forwards mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    const { container } = render(RadioButtonSkeletonEvents);

    const wrapper = container.querySelector(".bx--radio-button-wrapper");
    expect.assert(wrapper instanceof HTMLElement);

    await user.click(wrapper);
    expect(consoleLog).not.toHaveBeenCalledWith("click");

    await user.hover(wrapper);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(wrapper);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });
});
