import { render, screen } from "@testing-library/svelte";
import HeaderNavItem from "carbon-components-svelte/UIShell/HeaderNavItem.svelte";
import HeaderNavContent from "./HeaderNavContent.test.svelte";

describe("HeaderNavItem", () => {
  it.each([true, false])(
    "applies the current-page styling only when isSelected is %s",
    (isSelected) => {
      render(HeaderNavItem, {
        props: { href: "/", text: "Overview", isSelected },
      });

      const item = screen.getByRole("menuitem", { name: "Overview" });
      expect(item.classList.contains("bx--header__menu-item--current")).toBe(
        isSelected,
      );
      expect(item.getAttribute("aria-current")).toBe(
        isSelected ? "page" : null,
      );
    },
  );
});

describe("HeaderNavItem icon", () => {
  it("renders the icon prop after the text with the icon marker class", () => {
    render(HeaderNavContent);

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
    render(HeaderNavContent);

    const catalog = screen.getByRole("menuitem", { name: "Catalog" });
    expect(catalog).not.toHaveClass("bx--header__menu-item--icon");
    expect(catalog.querySelector("svg")).toBeNull();
  });

  it("supports a custom icon slot", () => {
    render(HeaderNavContent);

    const status = screen.getByRole("menuitem", { name: /Status/ });
    expect(status).toHaveClass("bx--header__menu-item--icon");
    expect(screen.getByTestId("slot-icon")).toBeInTheDocument();
  });
});

describe("HeaderNavItem label", () => {
  const label = (name: string) =>
    screen.getByRole("menuitem", { name }).querySelector("span");

  it("truncates top-level items but lets menu items wrap", () => {
    render(HeaderNavContent);
    expect(label("Catalog")).toHaveClass("bx--text-truncate--end");
    expect(
      label("Cloud Object Storage and Data Lake Archival"),
    ).not.toHaveClass("bx--text-truncate--end");
  });
});
