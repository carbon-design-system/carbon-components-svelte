import { render, screen } from "@testing-library/svelte";
import Fixture from "./HeaderPanelLinkIcon.test.svelte";

describe("HeaderPanelLink text and icon", () => {
  it("renders the text prop and a decorative icon after the label", () => {
    render(Fixture);

    const docs = screen.getByRole("link", { name: "Docs" });
    const icon = docs.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("width", "16");
    expect(docs.lastElementChild).toBe(icon?.parentElement);
    expect(docs.lastElementChild).toHaveClass("bx--switcher__item-icon");
  });

  it("renders text on a button and omits the icon when unset", () => {
    render(Fixture);

    const plain = screen.getByRole("button", { name: "Plain" });
    expect(plain.querySelector("svg")).toBeNull();
    expect(plain.querySelector(".bx--switcher__item-icon")).toBeNull();
  });

  it("supports a custom icon slot", () => {
    render(Fixture);

    expect(screen.getByTestId("slot-icon")).toBeInTheDocument();
  });
});
