import { render, screen } from "@testing-library/svelte";
import TimePicker from "carbon-components-svelte/TimePicker/TimePicker.svelte";

describe("TimePicker aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(TimePicker, {
      props: {
        labelText: "Time",
        helperText: "hh:mm",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("textbox");
    expect(field).toHaveAccessibleDescription("hh:mm");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });

  it("joins it in the fluid variant too", () => {
    render(TimePicker, {
      props: {
        fluid: true,
        labelText: "Time",
        warn: true,
        warnText: "Outside office hours",
        "aria-describedby": "extra-help",
      },
    });

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
