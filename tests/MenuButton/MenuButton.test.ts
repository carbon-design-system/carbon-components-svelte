import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import MenuButtonSlot from "./MenuButton.slot.test.svelte";
import MenuButtonFixture from "./MenuButton.test.svelte";

describe("MenuButton", () => {
  it("opens the menu on trigger click and closes on a second click", async () => {
    render(MenuButtonFixture);

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the disabled state on the trigger", () => {
    render(MenuButtonFixture, { props: { disabled: true } });

    expect(screen.getByRole("button", { name: "Actions" })).toBeDisabled();
  });

  it("applies the kind and size classes to the trigger", () => {
    render(MenuButtonFixture, { props: { kind: "ghost", size: "lg" } });

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).toHaveClass("bx--btn--ghost");
    expect(trigger).toHaveClass("bx--btn--lg");
  });

  it("rotates the trigger's chevron by toggling the open modifier class", async () => {
    render(MenuButtonFixture);

    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger).not.toHaveClass("bx--menu-button__trigger--open");

    await user.click(trigger);
    expect(trigger).toHaveClass("bx--menu-button__trigger--open");
  });

  it("opens and focuses the first item with the keyboard", async () => {
    render(MenuButtonFixture);

    await user.tab();
    expect(screen.getByRole("button", { name: "Actions" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("menuitem", { name: "Cut" })).toHaveFocus();
  });

  it("opens with Space and selects the focused item with a second Space", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuButtonFixture);

    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Cut" })).toHaveFocus();

    await user.keyboard(" ");
    expect(consoleLog).toHaveBeenCalledWith("select", "Cut");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("dispatches close with a select trigger when an item is chosen", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuButtonFixture);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Copy" }));

    expect(consoleLog).toHaveBeenCalledWith("select", "Copy");
    expect(consoleLog).toHaveBeenCalledWith("close", { trigger: "select" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("dispatches close with an escape-key trigger and returns focus to the trigger", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(MenuButtonFixture);

    const trigger = screen.getByRole("button", { name: "Actions" });
    await user.click(trigger);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(consoleLog).toHaveBeenCalledWith("close", {
      trigger: "escape-key",
    });
  });

  it("renders the labelChildren slot instead of labelText, using labelText as the accessible name", () => {
    render(MenuButtonSlot);

    expect(screen.getByText("Custom trigger content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toBeInTheDocument();
  });
});
