import { render, screen } from "@testing-library/svelte";
import Kbd from "./Kbd.test.svelte";

describe("Kbd", () => {
  it("renders a kbd keycap by default", () => {
    render(Kbd);

    const node = screen.getByTestId("default");
    expect(node.tagName).toBe("KBD");
    expect(node).toHaveClass("bx--kbd");
    expect(node).not.toHaveClass("bx--kbd--sm");
    expect(node).not.toHaveClass("bx--kbd--muted");
    expect(node).toHaveTextContent("K");
  });

  it("maps size and variant to modifier classes", () => {
    render(Kbd);

    expect(screen.getByTestId("small")).toHaveClass("bx--kbd--sm");
    expect(screen.getByTestId("muted")).toHaveClass("bx--kbd--muted");
  });

  it("forwards rest props and binds ref", () => {
    const { component } = render(Kbd);

    const node = screen.getByTestId("forwarded");
    expect(node).toHaveAttribute("aria-keyshortcuts", "Control+K");
    expect(node).toHaveClass("bx--kbd", "custom");
    expect(component.ref).toBe(node);
  });
});
