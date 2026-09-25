import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Stack from "./Stack.events.test.svelte";

describe("Stack events", () => {
  it("forwards click, scroll, keyboard, and focus events", async () => {
    render(Stack);

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
