import { render, screen } from "@testing-library/svelte";
import ButtonSet from "./ButtonSet.test.svelte";

describe("ButtonSet", () => {
  it("renders buttons juxtaposed by default", () => {
    render(ButtonSet);

    const buttonSet = screen.getByTestId("button-set");
    expect(buttonSet).toBeInTheDocument();
    expect(buttonSet).toHaveClass("bx--btn-set");
  });

  it("renders buttons vertically when stacked prop is true", () => {
    render(ButtonSet, { stacked: true });

    const buttonSet = screen.getByTestId("button-set");
    expect(buttonSet).toBeInTheDocument();
    expect(buttonSet).toHaveClass("bx--btn-set");
    expect(buttonSet).toHaveClass("bx--btn-set--stacked");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("Cancel");
    expect(buttons[1]).toHaveTextContent("Submit");
  });
});
