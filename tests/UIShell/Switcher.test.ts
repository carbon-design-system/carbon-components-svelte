import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Switcher from "./Switcher.test.svelte";

describe("Switcher", () => {
  it("renders a list of items and a divider", () => {
    render(Switcher);

    const list = screen.getByRole("list");
    expect(list).toHaveClass("bx--switcher");
    expect(list).toHaveAttribute("aria-label", "Switcher");

    expect(screen.getByRole("link", { name: "Item one" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Item three" }),
    ).toBeInTheDocument();

    expect(list.querySelector(".bx--switcher__item--divider")).toBeTruthy();
  });

  it("marks the selected item", () => {
    render(Switcher);

    expect(screen.getByRole("link", { name: "Item two" })).toHaveClass(
      "bx--switcher__item-link--selected",
    );
    expect(screen.getByRole("link", { name: "Item one" })).not.toHaveClass(
      "bx--switcher__item-link--selected",
    );
  });

  it("makes items tabbable when expanded", () => {
    render(Switcher, { props: { expanded: true } });

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("tabindex", "0");
    }
  });

  it("makes items non-tabbable when not expanded", () => {
    render(Switcher, { props: { expanded: false } });

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("tabindex", "-1");
    }
  });

  it("moves focus between items with the arrow keys, wrapping at the ends", async () => {
    render(Switcher);

    const [itemOne, itemTwo, itemThree] = screen.getAllByRole("link");

    itemOne.focus();
    expect(itemOne).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(itemTwo).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(itemThree).toHaveFocus();

    // Wraps back around to the first item.
    await user.keyboard("{ArrowDown}");
    expect(itemOne).toHaveFocus();

    // Wraps backward to the last item.
    await user.keyboard("{ArrowUp}");
    expect(itemThree).toHaveFocus();
  });
});
