import { render, screen, waitFor } from "@testing-library/svelte";
import ActionSetSizeOverride from "./ActionSet.sizeOverride.test.svelte";
import ActionSet from "./ActionSet.test.svelte";

describe("ActionSet", () => {
  it("renders slotted Button children inside a presentation wrapper", () => {
    render(ActionSet, { count: 2 });

    const actionSet = screen.getByTestId("action-set");
    expect(actionSet).toHaveClass("bx--action-set");
    expect(actionSet).toHaveClass("bx--btn-set");
    expect(actionSet).toHaveAttribute("role", "presentation");

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("Cancel");
    expect(buttons[1]).toHaveTextContent("Delete");
  });

  it("sets the size layout class from the `size` prop", () => {
    render(ActionSet, { size: "lg", count: 2 });

    expect(screen.getByTestId("action-set")).toHaveClass("bx--action-set--lg");
  });

  it("always stacks at the sm size, regardless of action count", async () => {
    render(ActionSet, { size: "sm", count: 2 });

    const actionSet = screen.getByTestId("action-set");
    await waitFor(() =>
      expect(actionSet).toHaveClass("bx--action-set--stacking"),
    );
    expect(actionSet).toHaveClass("bx--btn-set--stacked");
  });

  it("stacks at the md size once there are more than two actions", async () => {
    render(ActionSet, { size: "md", count: 3 });

    const actionSet = screen.getByTestId("action-set");
    await waitFor(() =>
      expect(actionSet).toHaveClass("bx--action-set--stacking"),
    );
  });

  it("does not stack at the md size with two or fewer actions", async () => {
    render(ActionSet, { size: "md", count: 2 });

    const actionSet = screen.getByTestId("action-set");
    await waitFor(() =>
      expect(actionSet).toHaveClass("bx--action-set--row-double"),
    );
    expect(actionSet).not.toHaveClass("bx--action-set--stacking");
  });

  it("never stacks at the lg size, even with three actions", async () => {
    render(ActionSet, { size: "lg", count: 3 });

    const actionSet = screen.getByTestId("action-set");
    await waitFor(() =>
      expect(actionSet).toHaveClass("bx--action-set--row-triple"),
    );
    expect(actionSet).not.toHaveClass("bx--action-set--stacking");
  });

  it("does not stack at the sm size when disableStacking is true", async () => {
    render(ActionSet, { size: "sm", count: 2, disableStacking: true });

    const actionSet = screen.getByTestId("action-set");
    await waitFor(() =>
      expect(actionSet).toHaveClass("bx--action-set--row-double"),
    );
    expect(actionSet).not.toHaveClass("bx--action-set--stacking");
  });

  it("cascades its size to child buttons that don't set their own, without overriding one that does", () => {
    render(ActionSetSizeOverride);

    const buttons = screen.getAllByRole("button");
    expect(buttons[0]).toHaveTextContent("Cancel");
    expect(buttons[0]).toHaveClass("bx--btn--sm");
    expect(buttons[1]).toHaveTextContent("Save");
    expect(buttons[1]).toHaveClass("bx--btn--field");
    expect(buttons[1]).not.toHaveClass("bx--btn--sm");
  });
});
