import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import FormHelperTextTest from "./FormHelperText.test.svelte";

describe("FormHelperText", () => {
  it("describes the FormItem's control", () => {
    render(FormHelperTextTest);

    const helper = screen.getByText("Use your work email");
    expect(helper).toHaveClass("bx--form__helper-text");
    expect(helper).toHaveAttribute("id", "helper-email");
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Use your work email",
    );
    expect(screen.getByTestId("described-by")).toHaveTextContent(
      "helper-email",
    );
  });

  it("drops the description when unmounted", async () => {
    const { component } = render(FormHelperTextTest);

    component.showHelper = false;
    await tick();

    expect(screen.getByLabelText("Email")).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("inherits disabled from the FormItem", () => {
    render(FormHelperTextTest, { props: { disabled: true } });

    expect(screen.getByText("Use your work email")).toHaveClass(
      "bx--form__helper-text--disabled",
    );
  });

  it("renders standalone with its own id and rest props", () => {
    render(FormHelperTextTest);

    const helper = screen.getByText("Standalone");
    expect(helper).toHaveAttribute("id", "standalone");
    expect(helper).toHaveClass("bx--form__helper-text", "custom");
    expect(helper).not.toHaveClass("bx--form__helper-text--disabled");
  });
});
