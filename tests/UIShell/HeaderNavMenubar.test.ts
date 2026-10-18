import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import Fixture from "./HeaderNavMenubar.test.svelte";

const link1 = () => screen.getByRole("menuitem", { name: "Link 1" });
const link2 = () => screen.getByRole("menuitem", { name: "Link 2" });
const trigger = () => screen.getByRole("menuitem", { name: "Menu" });
const menuItem = (name: string) => screen.getByRole("menuitem", { name });

describe("HeaderNav menubar", () => {
  describe("roving tabindex", () => {
    it("makes the first item the only Tab stop by default", async () => {
      render(Fixture);
      await tick(); // let registrations flush

      expect(link1()).toHaveAttribute("tabindex", "0");
      expect(trigger()).toHaveAttribute("tabindex", "-1");
      expect(link2()).toHaveAttribute("tabindex", "-1");
    });

    it("prefers the current page item", async () => {
      render(Fixture, { props: { current: "Link 2" } });
      await tick();

      expect(link1()).toHaveAttribute("tabindex", "-1");
      expect(trigger()).toHaveAttribute("tabindex", "-1");
      expect(link2()).toHaveAttribute("tabindex", "0");
    });

    it("moves the Tab stop with focus", async () => {
      render(Fixture);

      link1().focus();
      await user.keyboard("{ArrowRight}");

      expect(trigger()).toHaveFocus();
      expect(trigger()).toHaveAttribute("tabindex", "0");
      expect(link1()).toHaveAttribute("tabindex", "-1");
    });

    it("leaves items outside a HeaderNav tabbable", () => {
      render(Fixture, { props: { after: "item" } });

      expect(
        screen.getByRole("menuitem", { name: "Standalone" }),
      ).toHaveAttribute("tabindex", "0");
    });

    it("keeps submenu items tabbable", async () => {
      render(Fixture);

      trigger().focus();
      await user.keyboard("{ArrowDown}");
      expect(menuItem("Menu Item 1")).toHaveAttribute("tabindex", "0");
      expect(menuItem("Menu Item 2")).toHaveAttribute("tabindex", "0");
    });
  });

  describe("arrow keys", () => {
    it("moves between top-level items and wraps", async () => {
      render(Fixture);

      link1().focus();
      await user.keyboard("{ArrowRight}");
      expect(trigger()).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{ArrowRight}");
      expect(link1()).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(trigger()).toHaveFocus();
    });

    it("jumps to the first and last item with Home and End", async () => {
      render(Fixture);

      trigger().focus();
      await user.keyboard("{End}");
      expect(link2()).toHaveFocus();
      await user.keyboard("{Home}");
      expect(link1()).toHaveFocus();
    });

    it("closes an open menu when leaving its trigger", async () => {
      const onClose = vi.fn();
      render(Fixture, { props: { onClose } });

      trigger().focus();
      await user.keyboard("{Enter}");
      expect(trigger()).toHaveAttribute("aria-expanded", "true");

      trigger().focus();
      await user.keyboard("{ArrowRight}");
      expect(link2()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("closes the submenu and moves on from inside it", async () => {
      const onClose = vi.fn();
      render(Fixture, { props: { onClose } });

      trigger().focus();
      await user.keyboard("{ArrowDown}");
      expect(menuItem("Menu Item 1")).toHaveFocus();

      await user.keyboard("{ArrowRight}");
      expect(link2()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
      expect(onClose).toHaveBeenCalledTimes(1);

      trigger().focus();
      await user.keyboard("{ArrowDown}{ArrowDown}");
      expect(menuItem("Menu Item 2")).toHaveFocus();
      await user.keyboard("{ArrowLeft}");
      expect(link1()).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });

    it("keeps Home and End inside an open submenu", async () => {
      render(Fixture);

      trigger().focus();
      await user.keyboard("{ArrowDown}{End}");
      expect(menuItem("Menu Item 2")).toHaveFocus();
      await user.keyboard("{Home}");
      expect(menuItem("Menu Item 1")).toHaveFocus();
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });
  });
});
