import { render } from "@testing-library/svelte";
import PaginationSkeleton from "carbon-components-svelte/Pagination/PaginationSkeleton.svelte";
import { user } from "../utils/user";
import PaginationSkeletonFixture from "./PaginationSkeleton.test.svelte";

describe("PaginationSkeleton", () => {
  function getRoot(container: HTMLElement) {
    const pagination = container.querySelector(".bx--pagination");
    assert(pagination);
    return pagination;
  }

  it("does not apply a size modifier class by default (md)", () => {
    const { container } = render(PaginationSkeleton);

    const pagination = getRoot(container);
    expect(pagination).not.toHaveClass("bx--pagination--sm");
    expect(pagination).not.toHaveClass("bx--pagination--lg");
  });

  it("applies the extra small size modifier class", () => {
    const { container } = render(PaginationSkeleton, { props: { size: "xs" } });

    expect(getRoot(container)).toHaveClass("bx--pagination--xs");
  });

  it("applies the small size modifier class", () => {
    const { container } = render(PaginationSkeleton, { props: { size: "sm" } });

    expect(getRoot(container)).toHaveClass("bx--pagination--sm");
  });

  it("applies the large size modifier class", () => {
    const { container } = render(PaginationSkeleton, { props: { size: "lg" } });

    expect(getRoot(container)).toHaveClass("bx--pagination--lg");
  });

  describe("event forwarding", () => {
    it("does not forward click but forwards mouse events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(PaginationSkeletonFixture);

      const skeleton = getRoot(container);

      await user.click(skeleton);
      expect(consoleLog).not.toHaveBeenCalledWith("click");

      await user.hover(skeleton);
      expect(consoleLog).toHaveBeenCalledWith("mouseover");
      expect(consoleLog).toHaveBeenCalledWith("mouseenter");

      await user.unhover(skeleton);
      expect(consoleLog).toHaveBeenCalledWith("mouseleave");
    });
  });
});
