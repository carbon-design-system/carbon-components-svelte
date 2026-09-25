import { render, screen } from "@testing-library/svelte";
import StackRef from "./Stack.ref.test.svelte";

describe("Stack ref", () => {
  it("binds `ref` to the rendered element", async () => {
    const { rerender } = render(StackRef);

    expect(screen.getByTestId("ref-tag")).toHaveTextContent("DIV");
    expect(screen.getByText("Anchor")).toBeInTheDocument();

    // `tag` swaps the element, so the binding has to follow it.
    await rerender({ tag: "section" });
    expect(screen.getByTestId("ref-tag")).toHaveTextContent("SECTION");
  });

  it("binds `ref` on mount with an explicit tag", () => {
    render(StackRef, { props: { tag: "div" } });

    expect(screen.getByTestId("ref-tag")).not.toHaveTextContent("none");
  });
});
