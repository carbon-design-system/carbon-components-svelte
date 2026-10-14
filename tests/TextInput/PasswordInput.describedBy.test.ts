import { render, screen } from "@testing-library/svelte";
import PasswordInput from "carbon-components-svelte/TextInput/PasswordInput.svelte";

describe("PasswordInput aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(PasswordInput, {
      props: {
        labelText: "Password",
        helperText: "At least 8 characters",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByLabelText("Password");
    expect(field).toHaveAccessibleDescription("At least 8 characters");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
