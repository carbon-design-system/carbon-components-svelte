import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import StructuredListSkeleton from "./StructuredListSkeleton.test.svelte";

describe("StructuredListSkeleton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 3 columns by default", () => {
    const { container } = render(StructuredListSkeleton);

    expect(container.querySelectorAll(".bx--structured-list-th")).toHaveLength(
      3,
    );
    // 5 default rows x 3 columns
    expect(container.querySelectorAll(".bx--structured-list-td")).toHaveLength(
      15,
    );
  });

  it("respects the columns prop in both head and body rows", () => {
    const { container } = render(StructuredListSkeleton, {
      props: { columns: 6, rows: 4 },
    });

    expect(container.querySelectorAll(".bx--structured-list-th")).toHaveLength(
      6,
    );
    expect(container.querySelectorAll(".bx--structured-list-td")).toHaveLength(
      24,
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
