import { render, screen } from "@testing-library/svelte";
import FormGroup from "carbon-components-svelte/FormGroup/FormGroup.svelte";

describe("FormGroup aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(FormGroup, {
      props: {
        legendText: "Contact",
        message: true,
        messageText: "Pick at least one",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("group");
    expect(field).toHaveAccessibleDescription("Pick at least one");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
