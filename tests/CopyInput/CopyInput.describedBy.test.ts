import { render, screen } from "@testing-library/svelte";
import CopyInput from "carbon-components-svelte/CopyInput/CopyInput.svelte";

describe("CopyInput aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(CopyInput, {
      props: {
        labelText: "API key",
        value: "abc",
        helperText: "Keep it secret",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("textbox");
    expect(field).toHaveAccessibleDescription("Keep it secret");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
