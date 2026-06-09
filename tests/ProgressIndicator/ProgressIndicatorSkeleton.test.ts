import { render, screen } from "@testing-library/svelte";
import ProgressIndicatorSkeleton from "carbon-components-svelte/ProgressIndicator/ProgressIndicatorSkeleton.svelte";

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
});
