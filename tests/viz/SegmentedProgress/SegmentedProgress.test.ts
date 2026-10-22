import { render, screen } from "@testing-library/svelte";
import SegmentedProgress from "./SegmentedProgress.test.svelte";

const segments = (id: string) =>
  Array.from(
    screen
      .getByTestId(id)
      .querySelectorAll<HTMLElement>(".bx--viz-segments__segment"),
  );

describe("SegmentedProgress", () => {
  it("is a progressbar named with the count and draws one segment per step", () => {
    render(SegmentedProgress);

    const bar = screen.getByRole("progressbar", { name: "Onboarding: 4 of 8" });
    expect(bar).toHaveAttribute("aria-valuenow", "4");
    expect(bar).toHaveAttribute("aria-valuemax", "8");
    expect(bar).toHaveAttribute("aria-valuetext", "4 of 8");
    expect(bar.querySelector(".bx--viz-segments__value")).toHaveTextContent(
      "4 of 8",
    );
    expect(segments("basic")).toHaveLength(8);
    expect(
      segments("basic").map((s) =>
        s.classList.contains("bx--viz-segments__segment--done"),
      ),
    ).toEqual([true, true, true, true, false, false, false, false]);
    expect(bar).toHaveClass("bx--viz-segments--default");
  });

  it("fills part of a segment for a fraction and is decorative without a label", () => {
    render(SegmentedProgress);

    const root = screen.getByTestId("partial");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
    const marks = segments("partial");
    expect(marks[2]).toHaveClass("bx--viz-segments__segment--partial");
    expect(marks[2].style.getPropertyValue("--bx-viz-pct")).toBe("50%");
    expect(marks[3]).not.toHaveClass("bx--viz-segments__segment--partial");
  });

  it("clamps the value to the steps and takes a translated word", () => {
    render(SegmentedProgress);

    const bar = screen.getByRole("progressbar", { name: "Over: 3 von 3" });
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(
      segments("clamped").every((s) =>
        s.classList.contains("bx--viz-segments__segment--done"),
      ),
    ).toBe(true);
  });

  it("colors by status", async () => {
    const { rerender } = render(SegmentedProgress, { status: "warning" });
    expect(screen.getByTestId("basic")).toHaveClass(
      "bx--viz-segments--warning",
    );
    await rerender({ status: "success" });
    expect(screen.getByTestId("basic")).toHaveClass(
      "bx--viz-segments--success",
    );
  });
});
