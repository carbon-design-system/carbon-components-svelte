import { render, screen } from "@testing-library/svelte";
import ProgressIndicatorSkeleton from "carbon-components-svelte/ProgressIndicator/ProgressIndicatorSkeleton.svelte";
import { user } from "../utils/user";
import ProgressIndicatorSkeletonEvents from "./ProgressIndicatorSkeleton.events.test.svelte";

describe("ProgressIndicatorSkeleton", () => {
  it("applies space-equal class when spaceEqually is true", () => {
    render(ProgressIndicatorSkeleton, { props: { spaceEqually: true } });

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--progress--space-equal");
  });

  it("does not apply space-equal class in vertical variant", () => {
    render(ProgressIndicatorSkeleton, {
      props: { spaceEqually: true, vertical: true },
    });

    const list = screen.getByRole("list");
    expect(list).not.toHaveClass("bx--progress--space-equal");
    expect(list).toHaveClass("bx--progress--vertical");
  });

  it("does not apply space-equal class by default", () => {
    render(ProgressIndicatorSkeleton);

    const list = screen.getByRole("list");
    expect(list).not.toHaveClass("bx--progress--space-equal");
  });

  it("does not forward click but forwards mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ProgressIndicatorSkeletonEvents);

    const list = screen.getByRole("list");

    await user.click(list);
    expect(consoleLog).not.toHaveBeenCalledWith("click");

    await user.hover(list);
    expect(consoleLog).toHaveBeenCalledWith("mouseover");

    await user.unhover(list);
    expect(consoleLog).toHaveBeenCalledWith("mouseleave");
  });
});
