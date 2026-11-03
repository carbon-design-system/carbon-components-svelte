import { fireEvent, render, screen } from "@testing-library/svelte";
import { rect } from "../utils/rect";
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

  it("passes tooltipAlign to the trigger over the older props", () => {
    render(ComboButtonFixture, {
      props: {
        tooltipAlign: "left-end",
        tooltipPosition: "right",
        tooltipAlignment: "start",
      },
    });

    const trigger = screen.getByRole("button", { name: "Additional actions" });
    expect(trigger).toHaveClass(
      "bx--btn--icon-only--left",
      "bx--tooltip--align-end",
    );
    expect(trigger).not.toHaveClass("bx--btn--icon-only--right");
  });
});

describe("ComboButton menu placement", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.removeProperty("direction");
  });

  // A 146px group at `left` (a 106px primary action, then a 40px chevron)
  // and a 200px menu in a 1000px window.
  const layout = (left: number) => {
    vi.spyOn(document.documentElement, "clientWidth", "get").mockReturnValue(
      1000,
    );
    vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
      function (this: Element) {
        if (this.matches("[role='menu']")) return rect({ width: 200 });
        if (this.matches(".bx--combo-button")) {
          return rect({ left, width: 146 });
        }
        if (this.matches(".bx--combo-button__trigger")) {
          return rect({ left: left + 106, width: 40 });
        }
        if (this.matches("button")) return rect({ left, width: 106 });
        return rect();
      },
    );
  };

  // The portal's `left` is the group edge or center its alignment names.
  it.each([
    ["start", "ltr", 300, "300px"],
    ["center", "ltr", 300, "373px"],
    ["end", "ltr", 300, "446px"],
    ["start", "rtl", 300, "446px"],
    ["center", "rtl", 300, "373px"],
    ["end", "rtl", 300, "300px"],
    ["end", "ltr", 0, "0px"],
    ["center", "ltr", 0, "0px"],
    ["start", "rtl", 0, "0px"],
    ["start", "ltr", 854, "1000px"],
    ["end", "rtl", 854, "1000px"],
  ] as const)(
    "lines %s up with the group (%s, group at %ipx)",
    async (intrinsicAlign, dir, left, expected) => {
      document.documentElement.style.direction = dir;
      layout(left);
      render(ComboButtonFixture, { props: { intrinsicAlign } });

      const trigger = screen.getByRole("button", {
        name: "Additional actions",
      });
      await user.click(trigger);

      const portal = screen
        .getByRole("menu")
        .closest<HTMLElement>("[data-floating-portal]");
      assert(portal);
      await vi.waitFor(() => expect(portal.style.left).toBe(expected));

      await user.keyboard("{Escape}");
      expect(trigger).toHaveFocus();
    },
  );
});
