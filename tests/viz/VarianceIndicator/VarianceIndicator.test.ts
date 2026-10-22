import { render, screen } from "@testing-library/svelte";
import VarianceIndicator from "./VarianceIndicator.test.svelte";

const bar = (id: string) =>
  screen.getByTestId(id).querySelector<HTMLElement>(".bx--viz-variance__bar");
const half = (id: string, side: "negative" | "positive") =>
  screen
    .getByTestId(id)
    .querySelectorAll<HTMLElement>(".bx--viz-variance__half")[
    side === "negative" ? 0 : 1
  ];

describe("VarianceIndicator", () => {
  it("grows a bar from the zero line toward its sign, scaled to max", () => {
    render(VarianceIndicator);

    expect(half("under", "negative")).toContainElement(bar("under"));
    expect(bar("under")?.style.getPropertyValue("--bx-viz-pct")).toBe("40");
    expect(half("over", "positive")).toContainElement(bar("over"));
    expect(bar("over")?.style.getPropertyValue("--bx-viz-pct")).toBe("60");
    expect(bar("clamped")?.style.getPropertyValue("--bx-viz-pct")).toBe("100");
  });

  it("names the image with the label and the signed variance", () => {
    render(VarianceIndicator);

    expect(
      screen.getByRole("img", { name: "Revenue against plan, -12K" }),
    ).toBe(screen.getByTestId("under"));
    expect(screen.getByTestId("over")).toHaveTextContent("+18K");
    expect(screen.getByTestId("custom")).toHaveTextContent("-250 ms");
    expect(screen.getByTestId("clamped").textContent?.trim()).toBe("");
  });

  it("colors by whether the sign is good, and stays neutral at zero or without a value", () => {
    render(VarianceIndicator);

    expect(screen.getByTestId("under")).toHaveClass(
      "bx--viz-variance--unfavorable",
    );
    expect(screen.getByTestId("over")).toHaveClass(
      "bx--viz-variance--favorable",
    );
    expect(screen.getByTestId("cost")).toHaveClass(
      "bx--viz-variance--unfavorable",
    );
    expect(screen.getByTestId("zero")).not.toHaveClass(
      "bx--viz-variance--favorable",
    );
    expect(screen.getByTestId("zero")).not.toHaveClass(
      "bx--viz-variance--unfavorable",
    );
    expect(bar("zero")).toBeNull();
    expect(bar("missing")).toBeNull();
    expect(screen.getByTestId("missing")).toHaveTextContent("–");
  });

  it("is decorative without a label", () => {
    render(VarianceIndicator);

    expect(screen.getByTestId("cost")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("cost")).not.toHaveAttribute("role");
  });
});
