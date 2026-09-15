import { render, screen } from "@testing-library/svelte";
import RowAlign from "./Row.align.test.svelte";

describe("Row align", () => {
  it("should apply align classes to the row and column", () => {
    render(RowAlign);

    expect(screen.getByTestId("test-row")).toHaveClass("bx--row--align-center");
    expect(screen.getByTestId("test-col")).toHaveClass("bx--col--align-end");
  });
});
