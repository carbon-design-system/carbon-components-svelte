import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { expectInlineStyle } from "../utils/inline-style";
import { user } from "../utils/user";
import HeaderMenuKeyboardOpen from "./HeaderMenuKeyboardOpen.test.svelte";
import HeaderPanelExclusive from "./HeaderPanelExclusive.test.svelte";
import HeaderPanelFocusReturn from "./HeaderPanelFocusReturn.test.svelte";
import HeaderPanelHost from "./HeaderPanelHost.test.svelte";

const hosts = [
  {
    host: "HeaderAction",
    item: "HeaderPanelLink",
    variant: "action",
    triggerName: "Switcher",
    panelClass: "bx--header-panel",
    hasOutsideItem: true,
  },
  {
    host: "ProfileMenu",
    item: "ProfileMenuItem",
    variant: "profile",
    triggerName: "Profile",
    panelClass: "bx--profile-menu",
    hasOutsideItem: true,
  },
  {
    host: "HeaderSwitcher",
    item: "ProfileMenuItem",
    variant: "switcher",
    triggerName: "Acme",
    panelClass: "bx--header-switcher__menu",
    hasOutsideItem: false,
  },
] as const;

describe.each(hosts)(
  "$item closes its $host",
  ({ variant, triggerName, hasOutsideItem }) => {
    const trigger = () => screen.getByRole("button", { name: triggerName });

    it('closes with trigger "select" and returns focus to the trigger', async () => {
      const onClose = vi.fn();
      render(HeaderPanelHost, { props: { variant, onClose } });

      await user.click(trigger());
      expect(trigger()).toHaveAttribute("aria-expanded", "true");

      screen.getByRole("button", { name: "Button" }).focus();
      await user.keyboard("{Enter}");
      await tick();

      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(trigger()).toHaveFocus();
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
    });

    it('closes with trigger "escape-key" on Escape and refocuses the trigger', async () => {
      const onClose = vi.fn();
      render(HeaderPanelHost, { props: { variant, onClose } });

      await user.click(trigger());
      await flushDismiss();
      // Focus outside the panel, so only an explicit refocus can restore it.
      trigger().blur();
      await user.keyboard("{Escape}");

      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(trigger()).toHaveFocus();
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onClose.mock.calls[0][0].detail).toEqual({
        trigger: "escape-key",
      });
    });

    it("closes when an anchor is activated", async () => {
      const onClose = vi.fn();
      render(HeaderPanelHost, { props: { variant, onClose } });

      await user.click(trigger());
      await user.click(screen.getByRole("link", { name: "Anchor" }));

      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(onClose.mock.calls[0][0].detail).toEqual({ trigger: "select" });
    });

    it("stays open when the click handler calls preventDefault", async () => {
      const onClose = vi.fn();
      render(HeaderPanelHost, { props: { variant, onClose } });

      await user.click(trigger());
      await user.click(screen.getByRole("button", { name: "Stay open" }));

      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(onClose).not.toHaveBeenCalled();
    });

    // Only items can sit outside a panel; HeaderSwitcher shares ProfileMenuItem.
    if (hasOutsideItem) {
      it("does nothing for an item outside any panel", async () => {
        const onClose = vi.fn();
        render(HeaderPanelHost, { props: { variant, onClose } });

        await user.click(trigger());
        await user.click(screen.getByRole("button", { name: "Outside" }));

        // Only the outside click closed the panel, not a select.
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(onClose.mock.calls[0][0].detail).toEqual({
          trigger: "outside-click",
        });
      });
    }
  },
);

describe.each(hosts)(
  "$host trigger",
  ({ variant, triggerName, panelClass }) => {
    it("is a disclosure that controls its panel, not a menu button", async () => {
      render(HeaderPanelHost, { props: { variant } });
      const button = screen.getByRole("button", { name: triggerName });

      // aria-haspopup="true" means "menu", which the panel is not.
      expect(button).not.toHaveAttribute("aria-haspopup");
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(button).not.toHaveAttribute("aria-controls");

      await user.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");
      const panel = document.getElementById(
        button.getAttribute("aria-controls") ?? "",
      );
      expect(panel).toHaveClass(panelClass);
      if (variant === "action") {
        expect(screen.getByRole("region", { name: triggerName })).toBe(panel);
      }
    });

    it("removes the panel as soon as the update flushes when the transition is off", async () => {
      const { container } = render(HeaderPanelHost, { props: { variant } });
      const button = screen.getByRole("button", { name: triggerName });

      await fireEvent.click(button);
      expect(container.querySelector(`.${panelClass}`)).toBeInTheDocument();

      await fireEvent.click(button);
      expect(container.querySelector(`.${panelClass}`)).not.toBeInTheDocument();
    });
  },
);

describe.each(hosts.filter(({ variant }) => variant !== "action"))(
  "$host trigger arrow keys",
  ({ variant, triggerName }) => {
    it('dispatches open once with trigger "toggle" on ArrowDown', async () => {
      const onOpen = vi.fn();
      render(HeaderPanelHost, { props: { variant, onOpen } });

      const button = screen.getByRole("button", { name: triggerName });
      button.focus();
      await user.keyboard("{ArrowDown}");
      // The first press moves focus into the menu; return it to the trigger.
      button.focus();
      await user.keyboard("{ArrowDown}");

      expect(onOpen).toHaveBeenCalledTimes(1);
      expect(onOpen.mock.calls[0][0].detail).toEqual({ trigger: "toggle" });
    });
  },
);

describe("HeaderSwitcher", () => {
  it("limits the text width with maxWidth", () => {
    render(HeaderPanelHost, { props: { variant: "switcher", maxWidth: 120 } });

    expectInlineStyle(screen.getByText("Acme"), { maxWidth: "120px" });
  });

  it('closes with trigger "outside-click" on an outside click', async () => {
    const onClose = vi.fn();
    render(HeaderPanelHost, { props: { variant: "switcher", onClose } });
    const trigger = screen.getByRole("button", { name: "Acme" });

    await user.click(trigger);
    await user.click(document.body);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
  });

  it("does not close on outside click when preventCloseOnClickOutside is set", async () => {
    render(HeaderPanelHost, {
      props: { variant: "switcher", preventCloseOnClickOutside: true },
    });
    const trigger = screen.getByRole("button", { name: "Acme" });

    await user.click(trigger);
    await user.click(document.body);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Header panels", () => {
  const trigger = (name: string) => screen.getByRole("button", { name });

  it.each([
    ["Help", "Acme Corp"],
    ["Acme Corp", "Profile"],
    ["Profile", "Notifications"],
  ])(
    "opening %s then %s leaves only the second open",
    async (first, second) => {
      render(HeaderPanelExclusive);

      await user.click(trigger(first));
      expect(trigger(first)).toHaveAttribute("aria-expanded", "true");

      await user.click(trigger(second));
      expect(trigger(second)).toHaveAttribute("aria-expanded", "true");
      expect(trigger(first)).toHaveAttribute("aria-expanded", "false");
    },
  );
});

describe("header panels return focus when an item closes them", () => {
  // ProfileMenu and HeaderSwitcher close through `select()`, which
  // HeaderPanelHost.test.ts covers. Only HeaderAction closes by consumer.
  it("returns focus to the HeaderAction trigger when a consumer closes it", async () => {
    render(HeaderPanelFocusReturn, { props: { actionOpen: true } });

    screen.getByRole("button", { name: "Dismiss all" }).focus();
    await user.keyboard("{Enter}");
    await tick();

    const trigger = screen.getByRole("button", { name: "Notifications" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("does not move focus to the trigger on an outside click", async () => {
    render(HeaderPanelFocusReturn, { props: { profileOpen: true } });

    screen.getByRole("button", { name: "Log out" }).focus();
    await user.click(screen.getByText("Not focusable"));
    await tick();

    expect(screen.getByRole("button", { name: "Profile" })).not.toHaveFocus();
  });
});

describe.each([
  { trigger: "Acme Corp", first: "Acme Corp", last: "Globex" },
  { trigger: "Profile", first: "Settings", last: "Log out" },
])("$trigger opened from the keyboard", ({ trigger, first, last }) => {
  const button = () => screen.getByRole("button", { name: trigger });
  const item = (name: string) =>
    screen
      .getAllByText(name)
      .find((node) => node.closest(".bx--profile-menu"))
      ?.closest("a, button");

  it("focuses the first item on Enter", async () => {
    render(HeaderMenuKeyboardOpen);
    button().focus();
    await user.keyboard("{Enter}");
    expect(item(first)).toHaveFocus();
  });

  it("focuses the first item on ArrowDown", async () => {
    render(HeaderMenuKeyboardOpen);
    button().focus();
    await user.keyboard("{ArrowDown}");
    expect(item(first)).toHaveFocus();
  });

  it("focuses the last item on ArrowUp", async () => {
    render(HeaderMenuKeyboardOpen);
    button().focus();
    await user.keyboard("{ArrowUp}");
    expect(item(last)).toHaveFocus();
  });
});
