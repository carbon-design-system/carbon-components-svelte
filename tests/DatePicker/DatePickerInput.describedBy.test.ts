import { render, screen } from "@testing-library/svelte";
import DatePickerDescribedBy from "./DatePicker.describedBy.test.svelte";

describe("DatePickerInput aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(DatePickerDescribedBy);

    const field = screen.getByRole("textbox");
    expect(field).toHaveAccessibleDescription("mm/dd/yyyy");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
