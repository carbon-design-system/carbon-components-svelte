import { render, screen } from "@testing-library/svelte";
import Sparkline from "./Sparkline.test.svelte";

describe("Sparkline", () => {
  it("exposes an accessible name when label is set", () => {
    render(Sparkline);

    expect(
      screen.getByRole("img", { name: "Requests per minute" }),
    ).toBeInTheDocument();
  });

  it("is decorative when label is unset", () => {
    render(Sparkline);

    const svg = screen.getByTestId("unlabelled");
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
  });

  it("renders a line path starting with M", () => {
    render(Sparkline);

    const path = screen
      .getByTestId("line")
      .querySelector("path.bx--sparkline__line");
    expect(path).not.toBeNull();
    expect(path?.getAttribute("d")).toMatch(/^M/);
  });

  it("renders an area path when fill is set", () => {
    render(Sparkline);

    expect(
      screen.getByTestId("line-fill").querySelector(".bx--sparkline__area"),
    ).not.toBeNull();
  });

  it("renders one rect per value for the bar kind", () => {
    render(Sparkline);

    const rects = screen.getByTestId("bar").querySelectorAll("rect");
    expect(rects).toHaveLength(7);
  });

  it("applies the color modifier class", () => {
    render(Sparkline);

    expect(screen.getByTestId("error-color")).toHaveClass(
      "bx--sparkline--error",
    );
  });

  it("renders an svg with no path for empty values", () => {
    render(Sparkline);

    const svg = screen.getByTestId("empty");
    expect(svg.querySelector("path")).toBeNull();
    expect(svg.querySelector("rect")).toBeNull();
  });
});
