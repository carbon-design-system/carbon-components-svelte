import { render } from "@testing-library/svelte";
import PaginationSkeleton from "carbon-components-svelte/Pagination/PaginationSkeleton.svelte";

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
});
