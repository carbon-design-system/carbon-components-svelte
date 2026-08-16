import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ComposedModalStacked from "./ComposedModalStacked.test.svelte";

function endTransition(element: Element) {
  element.dispatchEvent(
    new TransitionEvent("transitionend", { propertyName: "transform" }),
  );
}

describe("Stacked ComposedModals", () => {
  it("closes only the topmost modal when Escape is pressed", async () => {
    render(ComposedModalStacked);

    await user.click(screen.getByTestId("launch-sibling-modal"));
    endTransition(screen.getByTestId("sibling-modal"));
    await tick();

    await user.click(screen.getByTestId("launch-child-modal"));
    endTransition(screen.getByTestId("child-modal"));
    await tick();

    expect(screen.getByTestId("modal")).toHaveClass("is-visible");
    expect(screen.getByTestId("sibling-modal")).toHaveClass("is-visible");
    expect(screen.getByTestId("child-modal")).toHaveClass("is-visible");

    await user.keyboard("{Escape}");

    expect(screen.getByTestId("modal")).toHaveClass("is-visible");
    expect(screen.getByTestId("sibling-modal")).toHaveClass("is-visible");
    expect(screen.getByTestId("child-modal")).not.toHaveClass("is-visible");
  });
});
