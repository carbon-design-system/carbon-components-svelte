import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Fixture from "./HeaderNavMenubar.test.svelte";

const props = { side: true };

const link1 = () => screen.getByRole("menuitem", { name: "Link 1" });
const link2 = () => screen.getByRole("menuitem", { name: "Link 2" });
const trigger = () => screen.getByRole("menuitem", { name: "Menu" });
const menuItem = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderSideNavItems menubar", () => {
  describe("roving tabindex", () => {
    it("makes the first item the only Tab stop", async () => {
      render(Fixture, { props });
      await tick();

      expect(link1()).toHaveAttribute("tabindex", "0");
      expect(trigger()).toHaveAttribute("tabindex", "-1");
      expect(link2()).toHaveAttribute("tabindex", "-1");
    });

    it("prefers the current page item", async () => {
      render(Fixture, { props: { ...props, current: "Link 2" } });
      await tick();

      expect(link1()).toHaveAttribute("tabindex", "-1");
      expect(link2()).toHaveAttribute("tabindex", "0");
    });
  });

  describe("arrow keys", () => {
    it("moves between top-level items with Up and Down and wraps", async () => {
      render(Fixture, { props });

      link1().focus();
      await user.keyboard("{ArrowDown}");
      expect(trigger()).toHaveFocus();
      expect(trigger()).toHaveAttribute("tabindex", "0");
      await user.keyboard("{ArrowDown}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(link1()).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(trigger()).toHaveFocus();
    });

    it("ignores Left and Right on top-level items", async () => {
      render(Fixture, { props });

      link1().focus();
      await user.keyboard("{ArrowRight}");
      expect(link1()).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(link1()).toHaveFocus();
    });

    it("jumps to the first and last item with Home and End", async () => {
      render(Fixture, { props });

      trigger().focus();
      await user.keyboard("{End}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{Home}");
      expect(link1()).toHaveFocus();
    });

    it("focuses the next item starting with the typed letter", async () => {
      render(Fixture, { props });

      link1().focus();
      await user.keyboard("m");
      expect(trigger()).toHaveFocus();
    });
  });

  describe("submenus", () => {
    it("does not open on Up or Down; moves to the neighbor", async () => {
      render(Fixture, { props });

      trigger().focus();
      await user.keyboard("{ArrowDown}");
      expect(link2()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");

      trigger().focus();
      await user.keyboard("{ArrowUp}");
      expect(link1()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("opens on Right and focuses the first item", async () => {
      render(Fixture, { props });

      trigger().focus();
      await user.keyboard("{ArrowRight}");
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(menuItem("Menu Item 1")).toHaveFocus();
    });

    it("moves between submenu items with Up and Down", async () => {
      render(Fixture, { props });

      trigger().focus();
      await user.keyboard("{ArrowRight}{ArrowDown}");
      expect(menuItem("Menu Item 2")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(menuItem("Menu Item 1")).toHaveFocus();
      await user.keyboard("{ArrowUp}");
      expect(menuItem("Menu Item 2")).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });

    it("closes on Left and returns focus to the trigger", async () => {
      const onClose = vi.fn();
      render(Fixture, { props: { ...props, onClose } });

      trigger().focus();
      await user.keyboard("{ArrowRight}{ArrowLeft}");
      expect(trigger()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledWith("Menu", "escape-key");
    });

    it("closes an open menu when Down leaves its trigger", async () => {
      const onClose = vi.fn();
      render(Fixture, { props: { ...props, onClose } });

      trigger().focus();
      await user.keyboard("{Enter}");
      expect(trigger()).toHaveAttribute("aria-expanded", "true");

      trigger().focus();
      await user.keyboard("{ArrowDown}");
      expect(link2()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
