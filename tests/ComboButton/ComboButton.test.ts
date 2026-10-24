import { fireEvent, render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ComboButtonSlot from "./ComboButton.slot.test.svelte";
import ComboButtonFixture from "./ComboButton.test.svelte";

describe("ComboButton", () => {
  it("fires the primary action click independently of the menu trigger", async () => {
    const onEvent = vi.fn();
    render(ComboButtonFixture, { props: { onEvent } });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onEvent).toHaveBeenCalledWith("click");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("dispatches click:trigger when the menu trigger is clicked, independent of click", async () => {
    const onEvent = vi.fn();
    render(ComboButtonFixture, { props: { onEvent } });

    await user.click(
      screen.getByRole("button", { name: "Additional actions" }),
    );

    expect(onEvent).toHaveBeenCalledWith("click:trigger");
    expect(onEvent).not.toHaveBeenCalledWith("click");
  });

  it.each([
    "mouseenter",
    "mouseover",
    "mouseleave",
    "focus",
    "blur",
    "mousedown",
  ])(
    "forwards %s from both buttons, and %s:trigger only from the trigger",
    async (name) => {
      const onEvent = vi.fn();
      render(ComboButtonFixture, { props: { onEvent } });

      const primaryAction = screen.getByRole("button", { name: "Save" });
      const trigger = screen.getByRole("button", {
        name: "Additional actions",
      });

      await fireEvent(primaryAction, new Event(name));
      expect(onEvent).toHaveBeenCalledWith(name);
      expect(onEvent).not.toHaveBeenCalledWith(`${name}:trigger`);

      onEvent.mockClear();
      await fireEvent(trigger, new Event(name));
      expect(onEvent).toHaveBeenCalledWith(name);
      expect(onEvent).toHaveBeenCalledWith(`${name}:trigger`);
    },
  );

  it("opens and closes the menu from the icon-only trigger", async () => {
    render(ComboButtonFixture);

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);

    await user.click(trigger);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the menu with ArrowDown on the first item and ArrowUp on the last", async () => {
    render(ComboButtonFixture);
    const trigger = screen.getByRole("button", { name: "Additional actions" });

    trigger.focus();
    await user.keyboard("{ArrowDown}");
    let items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveFocus();

    await user.keyboard("{Escape}");
    await user.keyboard("{ArrowUp}");
    items = screen.getAllByRole("menuitem");
    expect(items[items.length - 1]).toHaveFocus();
  });

  it("doesn't open the menu from the primary action's arrow keys", async () => {
    render(ComboButtonFixture);

    screen.getAllByRole("button")[0].focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("returns focus to the trigger button when Escape closes the menu", async () => {
    render(ComboButtonFixture);

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("opens and focuses the first item from the trigger", async () => {
    render(ComboButtonFixture);

    await user.click(
      screen.getByRole("button", { name: "Additional actions" }),
    );

    expect(screen.getByRole("menuitem", { name: "Save as" })).toHaveFocus();
  });

  it("disables both the primary action and trigger buttons", () => {
    render(ComboButtonFixture, { props: { disabled: true } });

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Additional actions" }),
    ).toBeDisabled();
  });

  it("shows a spinner on the primary action while loading, without disabling the trigger", async () => {
    const onEvent = vi.fn();
    render(ComboButtonFixture, {
      props: { loading: true, loadingDescription: "Saving", onEvent },
    });

    const primaryAction = screen.getByRole("button", { name: "Save" });
    expect(primaryAction.querySelector(".bx--btn__loading")).not.toBeNull();
    expect(primaryAction).not.toBeDisabled();
    expect(primaryAction).toHaveAttribute("aria-disabled", "true");

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    expect(trigger).not.toBeDisabled();
    expect(trigger).not.toHaveAttribute("aria-disabled");

    await user.click(primaryAction);
    expect(onEvent).not.toHaveBeenCalledWith("click");
  });

  it("defaults to the md size", async () => {
    render(ComboButtonFixture);

    expect(screen.getByRole("button", { name: "Save" })).toHaveClass(
      "bx--btn--field",
    );

    await user.click(
      screen.getByRole("button", { name: "Additional actions" }),
    );

    expect(screen.getByRole("menu")).toHaveClass("bx--menu--md");
  });

  it("hides the trigger tooltip once the menu is open", async () => {
    render(ComboButtonFixture);

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    expect(trigger).toHaveClass("bx--tooltip__trigger");

    await user.click(trigger);

    expect(trigger).not.toHaveClass("bx--tooltip__trigger");
  });

  it("renders the labelChildren slot instead of labelText, using labelText as the accessible name", () => {
    render(ComboButtonSlot);

    expect(screen.getByText("Custom label content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("keeps the tooltip position independent of the menu direction", () => {
    render(ComboButtonFixture, {
      props: { direction: "top", tooltipPosition: "right" },
    });

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    expect(trigger).toHaveClass("bx--btn--icon-only--right");
    expect(trigger).not.toHaveClass("bx--btn--icon-only--top");
  });
});
