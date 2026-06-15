import { render, screen } from "@testing-library/svelte";
import Fixture from "./HeaderNavItemIcon.test.svelte";

describe("HeaderNavItem icon", () => {
  it("renders the icon prop after the text with the icon marker class", () => {
    render(Fixture);

    const docs = screen.getByRole("menuitem", { name: "Docs" });
    expect(docs).toHaveClass("bx--header__menu-item--icon");

    const icon = docs.querySelector("svg");
    expect(icon).toBeInTheDocument();
    // Carbon icons are decorative by default; the label provides the name.
    expect(icon).toHaveAttribute("aria-hidden", "true");
    // The icon is the last child so it trails the text.
    expect(docs.lastElementChild).toBe(icon);
  });

  it("omits the icon marker class when no icon is provided", () => {
    render(Fixture);

    const catalog = screen.getByRole("menuitem", { name: "Catalog" });
    expect(catalog).not.toHaveClass("bx--header__menu-item--icon");
    expect(catalog.querySelector("svg")).toBeNull();
  });

  it("supports a custom icon slot", () => {
    render(Fixture);

    const status = screen.getByRole("menuitem", { name: /Status/ });
    expect(status).toHaveClass("bx--header__menu-item--icon");
    expect(screen.getByTestId("slot-icon")).toBeInTheDocument();
  });
});
