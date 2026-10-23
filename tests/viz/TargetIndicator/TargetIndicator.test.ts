import { render, screen } from "@testing-library/svelte";
import TargetIndicator from "./TargetIndicator.test.svelte";

const pct = (id: string, part: string) =>
  screen
    .getByTestId(id)
    .querySelector<HTMLElement>(`.bx--viz-target__${part}`)
    ?.style.getPropertyValue("--bx-viz-pct");

describe("TargetIndicator", () => {
  it("names the image with the attainment and the pace, and fills to the value", () => {
    render(TargetIndicator);

    const root = screen.getByRole("img", {
      name: "Quota attainment: 84 of 100, 84%, ahead of pace",
    });
    expect(root).toBe(screen.getByTestId("basic"));
    expect(root).toHaveClass("bx--viz-target--ahead");
    expect(root.querySelector(".bx--viz-target__value")).toHaveTextContent(
      "84 of 100",
    );
    expect(pct("basic", "measure")).toBe("84");
    expect(pct("basic", "expected")).toBe("78");
    expect(pct("basic", "goal")).toBe("100");
  });

  it("is behind pace under the expected tick and on pace at it", async () => {
    const { rerender } = render(TargetIndicator, { value: 60 });
    expect(screen.getByTestId("basic")).toHaveClass("bx--viz-target--behind");
    expect(screen.getByTestId("basic")).toHaveAccessibleName(
      "Quota attainment: 60 of 100, 60%, behind pace",
    );

    await rerender({ value: 78 });
    expect(screen.getByTestId("basic")).toHaveClass("bx--viz-target--onPace");

    // A prop set to undefined is dropped by rerender on Svelte 5; null clears it.
    await rerender({ value: 78, expected: null });
    expect(screen.getByTestId("basic")).toHaveClass("bx--viz-target--none");
    expect(
      screen.getByTestId("basic").querySelector(".bx--viz-target__expected"),
    ).toBeNull();
    expect(screen.getByTestId("basic")).toHaveAccessibleName(
      "Quota attainment: 78 of 100, 78%",
    );
  });

  it("is decorative without a label", () => {
    render(TargetIndicator);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelector(".bx--viz-target__value")).toBeNull();
  });

  it("extends the track past the target once the value passes it and says the target is met", () => {
    render(TargetIndicator);

    const root = screen.getByTestId("over");
    expect(root).toHaveClass("bx--viz-target--met");
    expect(root).toHaveAccessibleName("Over: 120 von 100, 120%, erreicht");
    expect(pct("over", "measure")).toBe("100");
    expect(pct("over", "goal")).toBeCloseTo(83.33, 1);
    expect(pct("over", "expected")).toBe("75");
  });

  it("shows nothing for a missing value", () => {
    render(TargetIndicator, { value: null });
    expect(screen.getByTestId("basic")).toHaveAccessibleName(
      "Quota attainment: –",
    );
    expect(pct("basic", "measure")).toBe("0");
  });
});
