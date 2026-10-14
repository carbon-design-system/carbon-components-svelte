import { render, screen } from "@testing-library/svelte";
import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";

describe("TextArea aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(TextArea, {
      props: {
        labelText: "Notes",
        helperText: "Optional",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("textbox");
    expect(field).toHaveAccessibleDescription("Optional");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
