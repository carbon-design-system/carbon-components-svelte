import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
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
  },
);
