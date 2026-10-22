import { render, screen } from "@testing-library/svelte";
import ShareOfTotal from "./ShareOfTotal.test.svelte";

const pct = (id: string) =>
  screen
    .getByTestId(id)
    .querySelector<HTMLElement>(".bx--viz-share__track")
    ?.style.getPropertyValue("--bx-viz-pct");

describe("ShareOfTotal", () => {
  it("names the image with the label and the share", () => {
    render(ShareOfTotal);

    const root = screen.getByRole("img", {
      name: "Enterprise share: 38% of total",
    });
    expect(root).toBe(screen.getByTestId("basic"));
    expect(pct("basic")).toBe("38");
    expect(root.querySelector(".bx--viz-share__value")).toHaveTextContent(
      "38% of total",
    );
  });

  it("is decorative without a label", () => {
    render(ShareOfTotal);

    const root = screen.getByTestId("decorative");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).not.toHaveAttribute("role");
  });

  it("honors the suffix, the digits, the color, and the size", () => {
    render(ShareOfTotal);

    const root = screen.getByTestId("precise");
    expect(root).toHaveAccessibleName("Done: 33.3%");
    expect(root).toHaveClass("bx--viz-share--sm");
    expect(root.style.getPropertyValue("--bx-viz-color")).toBe(
      "var(--cds-viz-success)",
    );
    expect(
      screen.getByTestId("bare").style.getPropertyValue("--bx-viz-color"),
    ).toBe("var(--cds-viz-cat-03)");
  });

  it("hides the text but keeps it in the accessible name", () => {
    render(ShareOfTotal);

    const root = screen.getByTestId("bare");
    expect(root.querySelector(".bx--viz-share__value")).toBeNull();
    expect(root).toHaveAccessibleName("Bare: 1% of total");
  });

  it("handles a missing total and clamps an overflowing part", () => {
    render(ShareOfTotal);

    expect(pct("empty")).toBe("0");
    expect(screen.getByTestId("empty")).toHaveAccessibleName("No total");
    expect(
      screen.getByTestId("empty").querySelector(".bx--viz-share__fill"),
    ).toHaveClass("bx--viz-share__fill--empty");
    expect(pct("over")).toBe("100");
  });
});
