import { render, screen } from "@testing-library/svelte";
import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";

describe("TextInput aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(TextInput, {
      props: {
        labelText: "Name",
        helperText: "Your full name",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("textbox");
    expect(field).toHaveAccessibleDescription("Your full name");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
