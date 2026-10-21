import { render, screen } from "@testing-library/svelte";
import ButtonFormSize from "./Button.formSize.test.svelte";

describe("Button in a sized Form", () => {
  it.each([
    ["xs", "bx--btn--xs"],
    ["sm", "bx--btn--sm"],
  ] as const)("takes the height of a %s Form", (size, className) => {
    render(ButtonFormSize, { props: { size } });
    expect(screen.getByTestId("inherits")).toHaveClass(className);
    expect(screen.getByTestId("skeleton")).toHaveClass(className);
    expect(screen.getByTestId("skeleton-prop")).toHaveClass(className);
  });

  it("stays the default height in an xl Form, the same 48px", () => {
    render(ButtonFormSize, { props: { size: "xl" } });
    const button = screen.getByTestId("inherits");
    for (const modifier of ["xs", "sm", "field", "lg", "xl"]) {
      expect(button).not.toHaveClass(`bx--btn--${modifier}`);
    }
  });

  it("keeps its own size", () => {
    render(ButtonFormSize, { props: { size: "sm" } });
    expect(screen.getByTestId("own-size")).toHaveClass("bx--btn--field");
  });

  it("leaves the buttons components draw themselves at their own size", () => {
    const { container } = render(ButtonFormSize, { props: { size: "sm" } });
    const internal = [
      ...container.ownerDocument.querySelectorAll(
        ".bx--modal-footer .bx--btn, .bx--pagination .bx--btn",
      ),
    ];
    expect(internal.length).toBeGreaterThan(0);
    for (const button of internal) {
      expect(button).not.toHaveClass("bx--btn--sm");
    }
  });
});
