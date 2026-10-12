import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import Fixture from "./HeaderNavMenubarOpen.test.svelte";

const item = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderNav menubar opening adjacent menus", () => {
  it("opens the next menu from inside an open one with ArrowRight", async () => {
    const onClose = vi.fn();
    render(Fixture, { props: { onClose } });

    item("Menu A").focus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(item("A2")).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(item("B1")).toHaveFocus();
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "true");
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith("A", "blur");
    // The Tab stop follows the new menu.
    expect(item("Menu B")).toHaveAttribute("tabindex", "0");
    expect(item("Menu A")).toHaveAttribute("tabindex", "-1");
  });

  it("opens the previous menu with ArrowLeft", async () => {
    render(Fixture);

    item("Menu B").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("B1")).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(item("A1")).toHaveFocus();
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "true");
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "false");
  });

  it("opens the next menu from an open menu's trigger", async () => {
    render(Fixture);

    item("Menu A").focus();
    await user.keyboard("{Enter}");
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "true");

    item("Menu A").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("B1")).toHaveFocus();
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "false");
  });

  it("only focuses a plain item", async () => {
    render(Fixture);

    item("Menu B").focus();
    await user.keyboard("{ArrowDown}{ArrowRight}");
    expect(item("Link 2")).toHaveFocus();
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "false");

    item("Menu A").focus();
    await user.keyboard("{ArrowDown}{ArrowLeft}");
    expect(item("Link 1")).toHaveFocus();
    expect(item("Menu A")).toHaveAttribute("aria-expanded", "false");
  });

  it("does not open the next menu from a closed trigger", async () => {
    render(Fixture);

    item("Menu A").focus();
    await user.keyboard("{ArrowRight}");
    expect(item("Menu B")).toHaveFocus();
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the opened menu with Escape and returns to its trigger", async () => {
    const onClose = vi.fn();
    render(Fixture, { props: { onClose } });

    item("Menu A").focus();
    await user.keyboard("{ArrowDown}{ArrowRight}{Escape}");
    expect(item("Menu B")).toHaveFocus();
    expect(item("Menu B")).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenLastCalledWith("B", "escape-key");
  });
});
