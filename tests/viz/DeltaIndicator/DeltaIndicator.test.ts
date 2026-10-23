import { render, screen } from "@testing-library/svelte";
import DeltaIndicator from "./DeltaIndicator.test.svelte";

const value = (id: string) =>
  screen.getByTestId(id).querySelector(".bx--viz-delta__value")?.textContent;
const announced = (id: string) =>
  screen.getByTestId(id).querySelector(".bx--visually-hidden")?.textContent;

describe("DeltaIndicator", () => {
  it("shows the sign, the arrow, and the tone for each direction", () => {
    render(DeltaIndicator);

    expect(value("up")).toBe("+128");
    expect(screen.getByTestId("up")).toHaveClass("bx--viz-delta--success");
    expect(value("down")).toBe("-64");
    expect(screen.getByTestId("down")).toHaveClass("bx--viz-delta--error");
    expect(value("zero")).toBe("0");
    expect(screen.getByTestId("zero")).toHaveClass("bx--viz-delta--neutral");
  });

  it("renders a dash with no icon for a missing or non-finite value", () => {
    render(DeltaIndicator);

    for (const id of ["missing", "nan"]) {
      expect(value(id)).toBe("–");
      expect(screen.getByTestId(id)).toHaveClass("bx--viz-delta--neutral");
      expect(screen.getByTestId(id).querySelector("svg")).toBeNull();
      expect(announced(id)).toBe("No change data");
    }
  });

  it("flips only the tone when lower is better", () => {
    render(DeltaIndicator);

    expect(screen.getByTestId("lower-better-down")).toHaveClass(
      "bx--viz-delta--success",
    );
    expect(value("lower-better-down")).toBe("-320");
    expect(announced("lower-better-down")).toBe("Decreased by 320");
    expect(screen.getByTestId("lower-better-up")).toHaveClass(
      "bx--viz-delta--error",
    );
  });

  it("treats a change at or below the threshold as neutral", () => {
    render(DeltaIndicator);

    expect(screen.getByTestId("within")).toHaveClass("bx--viz-delta--neutral");
    expect(screen.getByTestId("at")).toHaveClass("bx--viz-delta--neutral");
    expect(announced("within")).toBe("No change");
    expect(screen.getByTestId("beyond")).toHaveClass("bx--viz-delta--success");
  });

  it("formats as a ratio, in full, as currency, with a function, and per locale", () => {
    render(DeltaIndicator);

    expect(value("percent")).toBe("+12.3%");
    expect(value("full")).toBe("+12,840");
    expect(value("compact")).toBe("+12.8K");
    expect(value("currency")).toBe("+$1,250.00");
    expect(value("fn")).toBe("+3 seats");
    expect(value("locale")).toMatch(/^\+12,34\s?%$/);
  });

  it("announces a sentence and hides the visible number and the arrow", () => {
    render(DeltaIndicator);

    const root = screen.getByTestId("percent");
    expect(announced("percent")).toBe("Increased by 12.3%");
    expect(root.querySelector(".bx--viz-delta__value")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(root.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(announced("described")).toBe("Hausse de 12,3 %");
  });

  it("keeps the sign when the icon is hidden", () => {
    render(DeltaIndicator);

    expect(screen.getByTestId("no-icon").querySelector("svg")).toBeNull();
    expect(value("no-icon")).toBe("-4.1%");
  });

  it("renders the label and the size modifiers", () => {
    render(DeltaIndicator);

    expect(screen.getByTestId("label")).toHaveTextContent("vs last week");
    expect(screen.getByTestId("sm")).toHaveClass("bx--viz-delta--sm");
    expect(screen.getByTestId("lg")).toHaveClass("bx--viz-delta--lg");
  });

  it("updates the tone when props change", async () => {
    const { rerender } = render(DeltaIndicator, { value: 0.1 });
    expect(screen.getByTestId("reactive")).toHaveClass(
      "bx--viz-delta--success",
    );

    await rerender({ value: -0.1 });
    expect(screen.getByTestId("reactive")).toHaveClass("bx--viz-delta--error");

    await rerender({ value: -0.1, positive: "down" });
    expect(screen.getByTestId("reactive")).toHaveClass(
      "bx--viz-delta--success",
    );
  });
});
