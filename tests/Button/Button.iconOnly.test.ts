import { render, screen } from "@testing-library/svelte";
import ButtonIconOnly from "./Button.iconOnly.test.svelte";

describe("Button iconOnly", () => {
  it("can't infer icon-only from a wrapper that always passes content", () => {
    render(ButtonIconOnly);
    expect(screen.getByTestId("button")).not.toHaveClass("bx--btn--icon-only");
  });

  it("renders icon-only with iconOnly, without the default content", () => {
    render(ButtonIconOnly, { props: { iconOnly: true, text: "Add" } });
    const button = screen.getByTestId("button");
    expect(button).toHaveClass("bx--btn--icon-only");
    expect(button).not.toHaveTextContent(/^Add$/);
    expect(button.querySelector(".bx--btn__icon")).not.toBeNull();
  });

  it("renders a labelled button with iconOnly={false}", () => {
    render(ButtonIconOnly, { props: { iconOnly: false, text: "Add" } });
    const button = screen.getByTestId("button");
    expect(button).not.toHaveClass("bx--btn--icon-only");
    expect(button).toHaveTextContent("Add");
  });

  it("keeps a labelled button with iconOnly but no icon", () => {
    render(ButtonIconOnly, {
      props: { iconOnly: true, icon: null, text: "Add" },
    });
    const button = screen.getByTestId("button");
    expect(button).not.toHaveClass("bx--btn--icon-only");
    expect(button).toHaveTextContent("Add");
  });
});
