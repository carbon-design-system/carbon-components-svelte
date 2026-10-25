import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import StructuredListSkeleton from "./StructuredListSkeleton.test.svelte";

describe("StructuredListSkeleton", () => {
  it.each([
    ["3 columns by default", {}, 3, 15],
    [
      "the columns prop in both head and body rows",
      { columns: 6, rows: 4 },
      6,
      24,
    ],
  ])("renders %s", (_name, props, headCells, bodyCells) => {
    const { container } = render(StructuredListSkeleton, { props });

    expect(container.querySelectorAll(".bx--structured-list-th")).toHaveLength(
      headCells,
    );
    // rows x columns (5 default rows)
    expect(container.querySelectorAll(".bx--structured-list-td")).toHaveLength(
      bodyCells,
    );
  });

  it("does not forward click but forwards mouse events", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(StructuredListSkeleton);

    const skeleton = screen.getByTestId("structured-list-skeleton");
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
