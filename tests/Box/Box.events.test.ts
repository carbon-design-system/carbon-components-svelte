import { fireEvent, render, screen } from "@testing-library/svelte";
import Box from "carbon-components-svelte/Box/Box.svelte";
import Stack from "carbon-components-svelte/Stack/Stack.svelte";
import { user } from "../utils/user";
import Events from "./Box.events.test.svelte";

describe.each([
  ["Box", Box],
  ["Stack", Stack],
])("%s events", (_, component) => {
  it("forwards click, scroll, keyboard, and focus events", async () => {
    const onEvent = vi.fn();
    render(Events, { props: { component, onEvent } });

    const target = screen.getByTestId("target");
    await fireEvent.scroll(target);
    await user.click(screen.getByRole("button", { name: "Inner" }));
    await user.keyboard("a");
    await user.tab();

    expect(onEvent.mock.calls.map(([event]) => event)).toEqual([
      "scroll",
      "focusin",
      "click",
      "keydown:a",
      "keydown:Tab",
      "focusout",
    ]);
  });
});
