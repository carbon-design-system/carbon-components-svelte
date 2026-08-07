import { render, screen } from "@testing-library/svelte";
import ButtonSkeleton from "./ButtonSkeleton.test.svelte";

describe("ButtonSkeleton", () => {
  it("aligns the size scale with Carbon React's v11 xs/sm/md/lg/xl/2xl steps", () => {
    render(ButtonSkeleton);

    const sizes = {
      xs: "bx--btn--xs",
      sm: "bx--btn--sm",
      md: "bx--btn--field",
      lg: "bx--btn--lg-48",
      xl: "bx--btn--lg",
      "2xl": "bx--btn--xl",
    };

    for (const [testId, className] of Object.entries(sizes)) {
      expect(screen.getByTestId(testId)).toHaveClass(className);
    }
  });

  it("renders the default size with no size modifier class", () => {
    render(ButtonSkeleton);

    const button = screen.getByTestId("default");
    for (const className of [
      "bx--btn--xs",
      "bx--btn--sm",
      "bx--btn--field",
      "bx--btn--lg-48",
      "bx--btn--lg",
      "bx--btn--xl",
    ]) {
      expect(button).not.toHaveClass(className);
    }
  });

  it("renders an anchor when href is set", () => {
    render(ButtonSkeleton);

    const link = screen.getByTestId("href-lg");
    expect(link.tagName).toBe("A");
    expect(link).toHaveClass("bx--btn--lg-48");
  });
});
