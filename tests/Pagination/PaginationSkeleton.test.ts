import { render } from "@testing-library/svelte";
import PaginationSkeleton from "carbon-components-svelte/Pagination/PaginationSkeleton.svelte";
import { user } from "../utils/user";
import PaginationSkeletonFixture from "./PaginationSkeleton.test.svelte";

describe("PaginationSkeleton", () => {
  it.each([
    [undefined, null],
    ["xs", "xs"],
    ["sm", "sm"],
    ["lg", "lg"],
  ] as const)("size %s applies the %s modifier class", (size, modifier) => {
    const { container } = render(PaginationSkeleton, { props: { size } });

    const pagination = container.querySelector(".bx--pagination");
    assert(pagination);
    for (const candidate of ["xs", "sm", "lg"]) {
      if (candidate === modifier) {
        expect(pagination).toHaveClass(`bx--pagination--${candidate}`);
      } else {
        expect(pagination).not.toHaveClass(`bx--pagination--${candidate}`);
      }
    }
  });

  describe("event forwarding", () => {
    it("does not forward click but forwards mouse events", async () => {
      const consoleLog = vi.spyOn(console, "log");
      const { container } = render(PaginationSkeletonFixture);

      const skeleton = container.querySelector(".bx--pagination");
      assert(skeleton);

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
