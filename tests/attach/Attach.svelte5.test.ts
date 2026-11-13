import { render, screen } from "@testing-library/svelte";
import AttachTest from "./Attach.svelte5.test.svelte";

// Svelte 5 attachments are props, so a component's rest props carry them
// to the element it spreads them on. This is how to apply an action to a
// component, which `use:` can't target.
describe("{@attach}", () => {
  it("reaches the element that takes rest props", () => {
    const nodes: Element[] = [];
    const action = vi.fn();

    render(AttachTest, {
      props: { attach: (node: Element) => void nodes.push(node), action },
    });

    expect(nodes).toEqual([
      screen.getByRole("textbox", { name: "Name" }),
      screen.getByRole("button", { name: "Save" }),
    ]);
    expect(action.mock.calls[0]?.[0]).toBe(screen.getByTestId("form"));
  });

  it("cleans up when the component unmounts", async () => {
    const cleanup = vi.fn();
    const destroy = vi.fn();

    const { rerender } = render(AttachTest, {
      props: { attach: () => cleanup, action: () => ({ destroy }) },
    });
    await rerender({ show: false });

    expect(cleanup).toHaveBeenCalledTimes(2);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
