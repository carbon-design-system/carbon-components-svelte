import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Box from "./Box.events.test.svelte";

describe("Box events", () => {
  it("forwards click, scroll, keyboard, and focus events", async () => {
    render(Box);

    const target = screen.getByTestId("target");
    await fireEvent.scroll(target);
    await user.click(screen.getByRole("button", { name: "Inner" }));
    await user.keyboard("a");
    await user.tab();

    expect(screen.getByTestId("events")).toHaveTextContent(
      "scroll,focusin,click,keydown:a,keydown:Tab,focusout",
    );
  });
});
