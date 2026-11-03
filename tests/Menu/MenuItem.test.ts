import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import MenuItemRadioGroupFixture from "./MenuItem.radioGroup.test.svelte";
import MenuItemSelectableFixture from "./MenuItem.selectable.test.svelte";
import MenuItemSlot from "./MenuItem.slot.test.svelte";
import MenuItemFixture from "./MenuItem.test.svelte";

/** MenuItem's hover-open/close delay for a submenu. */
const HOVER_DELAY_MS = 150;

describe("MenuItem", () => {
  it("renders an icon to the left of the label", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Add item" });
    const icon = item.querySelector(".bx--menu-option__icon svg");
    expect(icon).toBeInTheDocument();
  });

  it("reserves an icon column for a sibling without its own icon, so its label lines up with icon items", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Plain" });
    expect(item.querySelector(".bx--menu-option__icon")).toBeInTheDocument();
  });

  it("renders shortcutText in the info region", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Save ⌘S" });
    expect(item.querySelector(".bx--menu-option__info")).toHaveTextContent(
      "⌘S",
    );
  });

  it("renders the shortcutText slot", async () => {
    render(MenuItemSlot);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Save ⌘S" });
    expect(item.querySelector(".bx--menu-option__info kbd")).toHaveTextContent(
      "⌘S",
    );
  });

  it("renders the shortcutChildren slot", async () => {
    render(MenuItemSlot);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Copy ⌘C" });
    expect(item.querySelector(".bx--menu-option__info kbd")).toHaveTextContent(
      "⌘C",
    );
  });

  it("prefers the shortcutChildren slot over the shortcutText slot", async () => {
    render(MenuItemSlot);

    await user.click(screen.getByRole("button", { name: "Trigger" }));

    const item = screen.getByRole("menuitem", { name: "Paste ⌘V" });
    expect(item.querySelectorAll(".bx--menu-option__info kbd")).toHaveLength(1);
    expect(item).not.toHaveTextContent("Old");
  });

  it("prevents Space's default action (page scroll) when selecting an item", async () => {
    render(MenuItemFixture);

    await user.click(screen.getByRole("button", { name: "Trigger" }));
    const item = screen.getByRole("menuitem", { name: "Add item" });
    item.focus();

    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    item.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  describe("submenu", () => {
    it("renders a caret and aria attributes for an item with nested children", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const parent = screen.getByRole("menuitem", { name: "Export as" });
      expect(parent).toHaveAttribute("aria-haspopup", "true");
      expect(parent).toHaveAttribute("aria-expanded", "false");
      expect(
        parent.querySelector(".bx--menu-option__info svg"),
      ).toBeInTheDocument();
    });

    it("opens the submenu on click without selecting or closing the root menu", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitem", { name: "Export as" }));

      expect(screen.getByRole("menuitem", { name: "PDF" })).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: "Export as" }),
      ).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("menuitem", { name: "Add item" }),
      ).toBeInTheDocument();
    });

    it("flips the submenu to the left when there is no room on the right", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const parent = screen.getByRole("menuitem", { name: "Export as" });
      // Sit the parent item near the right edge of the viewport, as if the
      // root menu opened flush against the window's right side, and give
      // every other element (notably the submenu's own <ul>, which does
      // not exist until this click creates it) a realistic width. jsdom
      // otherwise reports 0x0 for unmocked elements, so the flip check's
      // "does the floating content fit" math is always trivially true.
      try {
        vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
          function (this: Element) {
            if (this === parent) {
              return rect({
                top: 100,
                height: 30,
                left: window.innerWidth - 10,
                width: 10,
              });
            }
            return rect({ bottom: 200, right: 200 });
          },
        );

        await user.click(parent);

        const submenu = screen.getByRole("menu", { name: "Export as" });
        expect(submenu).toHaveAttribute("data-floating-menu-direction", "left");
      } finally {
        vi.restoreAllMocks();
      }
    });

    describe("in RTL", () => {
      beforeEach(() => {
        document.documentElement.style.direction = "rtl";
      });

      afterEach(() => {
        document.documentElement.style.removeProperty("direction");
        vi.restoreAllMocks();
      });

      /** Open "Export as" with the parent item `left` px from the left edge. */
      async function openSubmenu(left: number) {
        render(MenuItemFixture);
        await user.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });
        vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
          function (this: Element) {
            if (this === parent) {
              return rect({ top: 100, height: 30, left, width: 200 });
            }
            return rect({ bottom: 200, right: 200 });
          },
        );
        await user.click(parent);
        return screen.getByRole("menu", { name: "Export as" });
      }

      it("opens the submenu to the left", async () => {
        const submenu = await openSubmenu(400);
        expect(submenu).toHaveAttribute("data-floating-menu-direction", "left");
      });

      it("flips the submenu to the right when there is no room on the left", async () => {
        const submenu = await openSubmenu(10);
        expect(submenu).toHaveAttribute(
          "data-floating-menu-direction",
          "right",
        );
      });

      it("opens the submenu with ArrowLeft and closes it with ArrowRight", async () => {
        render(MenuItemFixture);
        await user.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });
        parent.focus();

        await user.keyboard("{ArrowRight}");
        expect(parent).toHaveAttribute("aria-expanded", "false");

        await user.keyboard("{ArrowLeft}");
        expect(screen.getByRole("menuitem", { name: "PDF" })).toHaveFocus();

        await user.keyboard("{ArrowRight}");
        expect(parent).toHaveFocus();
        expect(parent).toHaveAttribute("aria-expanded", "false");
      });
    });

    it("opens the submenu with ArrowRight and focuses the first item", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitem", { name: "Export as" }).focus();
      await user.keyboard("{ArrowRight}");

      expect(screen.getByRole("menuitem", { name: "PDF" })).toHaveFocus();
    });

    it("closes the submenu with ArrowLeft and refocuses the parent item", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitem", { name: "Export as" }).focus();
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{ArrowLeft}");

      expect(
        screen.queryByRole("menuitem", { name: "PDF" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Export as" })).toHaveFocus();
    });

    it.each(["{Escape}", "{Tab}"])(
      "closes the whole tree on %s inside the submenu and refocuses the trigger",
      async (key) => {
        render(MenuItemFixture);

        const trigger = screen.getByRole("button", { name: "Trigger" });
        await user.click(trigger);
        screen.getByRole("menuitem", { name: "Export as" }).focus();
        await user.keyboard("{ArrowRight}");
        expect(screen.getByRole("menuitem", { name: "PDF" })).toHaveFocus();

        await user.keyboard(key);
        await tick();

        expect(screen.queryByRole("menu")).not.toBeInTheDocument();
        expect(trigger).toHaveFocus();
      },
    );

    it("refocuses the trigger after selecting a nested item with the keyboard", async () => {
      render(MenuItemFixture);

      const trigger = screen.getByRole("button", { name: "Trigger" });
      await user.click(trigger);
      screen.getByRole("menuitem", { name: "Export as" }).focus();
      await user.keyboard("{ArrowRight}");
      await user.keyboard("{Enter}");
      await tick();

      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });

    it("prevents ArrowLeft's default action (page scroll) when closing the submenu", async () => {
      render(MenuItemFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitem", { name: "Export as" }).focus();
      await user.keyboard("{ArrowRight}");

      const submenuItem = screen.getByRole("menuitem", { name: "PDF" });
      const event = new KeyboardEvent("keydown", {
        key: "ArrowLeft",
        bubbles: true,
        cancelable: true,
      });
      submenuItem.dispatchEvent(event);

      expect(event.defaultPrevented).toBe(true);
    });

    it.each([
      { key: "ArrowLeft", mod: { altKey: true }, inSubmenu: true },
      { key: "ArrowRight", mod: { metaKey: true }, inSubmenu: false },
      { key: "ArrowDown", mod: { metaKey: true }, inSubmenu: false },
    ])(
      "leaves $key with $mod to the browser",
      async ({ key, mod, inSubmenu }) => {
        render(MenuItemFixture);

        await user.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });
        parent.focus();
        if (inSubmenu) await user.keyboard("{ArrowRight}");
        const focused = document.activeElement as HTMLElement;

        const notPrevented = await fireEvent.keyDown(focused, { key, ...mod });

        expect(notPrevented).toBe(true);
        expect(focused).toHaveFocus();
        expect(parent).toHaveAttribute("aria-expanded", String(inSubmenu));
      },
    );

    describe("hover", () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it("opens the submenu on hover after a delay", async () => {
        render(MenuItemFixture);

        await fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });

        await fireEvent.mouseEnter(parent);
        expect(
          screen.queryByRole("menuitem", { name: "PDF" }),
        ).not.toBeInTheDocument();

        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
        expect(
          screen.getByRole("menuitem", { name: "PDF" }),
        ).toBeInTheDocument();
      });

      it("does not close the submenu when the pointer moves into it before the close delay elapses", async () => {
        render(MenuItemFixture);

        await fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });
        await fireEvent.mouseEnter(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
        expect(
          screen.getByRole("menuitem", { name: "PDF" }),
        ).toBeInTheDocument();

        await fireEvent.mouseLeave(parent);
        const submenu = screen.getByRole("menu", { name: "Export as" });
        await fireEvent.mouseEnter(submenu);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        expect(
          screen.getByRole("menuitem", { name: "PDF" }),
        ).toBeInTheDocument();
      });

      it("closes only the submenu, keeping the root menu open, when the submenu is left", async () => {
        render(MenuItemFixture);

        await fireEvent.click(screen.getByRole("button", { name: "Trigger" }));
        const parent = screen.getByRole("menuitem", { name: "Export as" });
        await fireEvent.mouseEnter(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);
        expect(
          screen.getByRole("menuitem", { name: "PDF" }),
        ).toBeInTheDocument();

        await fireEvent.mouseLeave(parent);
        await vi.advanceTimersByTimeAsync(HOVER_DELAY_MS);

        expect(
          screen.queryByRole("menuitem", { name: "PDF" }),
        ).not.toBeInTheDocument();
        expect(
          screen.getByRole("menuitem", { name: "Add item" }),
        ).toBeInTheDocument();
      });
    });

    it("renders the labelChildren slot instead of labelText, using labelText as the title", async () => {
      render(MenuItemSlot);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      expect(screen.getByText("Custom label content")).toBeInTheDocument();
      const parent = screen.getByRole("menuitem", {
        name: "Custom label content",
      });
      // On the interactive element (the <li>), not the label span: the label
      // truncates with an ellipsis, so the title needs to be reachable by
      // hovering anywhere in the row, not just the label text itself.
      expect(parent).toHaveAttribute("title", "Export as");
    });
  });

  describe("selectable", () => {
    const getSelectedIds = () =>
      JSON.parse(screen.getByTestId("selected-ids").textContent || "[]");

    it("renders checkbox items and seeds the bound value from a selected item", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      expect(
        screen.getByRole("group", { name: "Columns" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Name" }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Size" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(getSelectedIds()).toEqual(["size"]);
    });

    it("keeps a pre-set selection and ignores a selected item", async () => {
      render(MenuItemSelectableFixture, { props: { selectedIds: ["name"] } });

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      expect(
        screen.getByRole("menuitemcheckbox", { name: "Size" }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Name" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(getSelectedIds()).toEqual(["name"]);
    });

    it("renders a checked item's own icon alongside its checkmark, in separate columns", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const item = screen.getByRole("menuitemcheckbox", { name: "Size" });
      const selectionIcon = item.querySelector(
        ".bx--menu-option__selection-icon svg",
      );
      const icon = item.querySelector(".bx--menu-option__icon svg");
      expect(selectionIcon).toBeInTheDocument();
      expect(icon).toBeInTheDocument();
    });

    it("reserves a checkmark column for a plain sibling so its label stays aligned with checkbox items", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const plainItem = screen.getByRole("menuitem", { name: "Plain" });
      expect(
        plainItem.querySelector(".bx--menu-option__selection-icon"),
      ).toBeInTheDocument();
    });

    it("toggles aria-checked and the bound selectedIds on click", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Name" }));

      expect(getSelectedIds()).toEqual(["size", "name"]);

      // Selecting closes the menu, so reopen it to toggle the item back off.
      await user.click(screen.getByRole("button", { name: "Trigger" }));
      expect(
        screen.getByRole("menuitemcheckbox", { name: "Name" }),
      ).toHaveAttribute("aria-checked", "true");

      await user.click(screen.getByRole("menuitemcheckbox", { name: "Name" }));
      expect(getSelectedIds()).toEqual(["size"]);
    });

    it("selects with Enter", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitemcheckbox", { name: "Name" }).focus();
      await user.keyboard("{Enter}");

      expect(getSelectedIds()).toEqual(["size", "name"]);
    });

    it("moves focus from an item that took focus by mouse", async () => {
      render(MenuItemSelectableFixture);
      await user.click(screen.getByRole("button", { name: "Trigger" }));
      // Date prevents its click, so the menu stays open with Date focused.
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Date" }));

      await user.keyboard("{ArrowUp}");

      expect(
        screen.getByRole("menuitemcheckbox", { name: "Size" }),
      ).toHaveFocus();
    });

    it.each([{ nested: false }, { nested: true }])(
      "keeps an unchecked initial item unchecked on reopen (nested: $nested)",
      async ({ nested }) => {
        render(MenuItemSelectableFixture, { nested });
        const trigger = screen.getByRole("button", { name: "Trigger" });
        const open = async () => {
          await user.click(trigger);
          if (nested)
            await user.click(screen.getByRole("menuitem", { name: "View" }));
        };
        await open();
        await user.click(
          screen.getByRole("menuitemcheckbox", { name: "Size" }),
        );
        expect(getSelectedIds()).toEqual([]);

        await open();

        expect(
          screen.getByRole("menuitemcheckbox", { name: "Size" }),
        ).toHaveAttribute("aria-checked", "false");
        expect(getSelectedIds()).toEqual([]);
      },
    );

    it("keeps the menu open when click is prevented and still toggles selection", async () => {
      render(MenuItemSelectableFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Date" }));

      expect(screen.getByRole("menu")).toBeInTheDocument();
      expect(getSelectedIds()).toEqual(["size", "date"]);
    });
  });

  describe("radio group", () => {
    const getSelectedId = () => screen.getByTestId("selected-id").textContent;

    it("renders radio items and seeds the bound value from a selected item", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      expect(
        screen.getByRole("group", { name: "Density" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitemradio", { name: "Compact" }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        screen.getByRole("menuitemradio", { name: "Comfortable" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(getSelectedId()).toBe("comfortable");
    });

    it("unchecks the previous item when another one is selected", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitemradio", { name: "Compact" }));

      expect(getSelectedId()).toBe("compact");

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      expect(
        screen.getByRole("menuitemradio", { name: "Compact" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("menuitemradio", { name: "Comfortable" }),
      ).toHaveAttribute("aria-checked", "false");
    });

    it("selects with Space", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      screen.getByRole("menuitemradio", { name: "Compact" }).focus();
      await user.keyboard(" ");

      expect(getSelectedId()).toBe("compact");
    });

    it("keeps nested and root menus open when a radio click is prevented", async () => {
      render(MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      await user.click(screen.getByRole("menuitem", { name: "View" }));
      await user.click(screen.getByRole("menuitemradio", { name: "Dark" }));

      expect(
        screen.getByRole("menuitemradio", { name: "Dark" }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("menuitemradio", { name: "Light" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("menuitem", { name: "Plain" }),
      ).toBeInTheDocument();
    });
  });

  describe.each([
    {
      kind: "checkbox",
      Fixture: MenuItemSelectableFixture,
      role: "menuitemcheckbox",
      // Each ArrowDown from the focused "Plain" item lands on the next name.
      arrowTargets: ["Name", "Size"],
    },
    {
      kind: "radio",
      Fixture: MenuItemRadioGroupFixture,
      role: "menuitemradio",
      arrowTargets: ["Compact", undefined],
    },
  ] as const)("$kind items", ({ Fixture, role, arrowTargets }) => {
    it("reserves a checkmark column", async () => {
      render(Fixture as typeof MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));

      const item = screen.getByRole(role, { name: arrowTargets[0] });
      expect(
        item.querySelector(".bx--menu-option__selection-icon"),
      ).toBeInTheDocument();
    });

    it("moves focus onto them with arrow keys", async () => {
      render(Fixture as typeof MenuItemRadioGroupFixture);

      await user.click(screen.getByRole("button", { name: "Trigger" }));
      expect(screen.getByRole("menuitem", { name: "Plain" })).toHaveFocus();

      const [first, second] = arrowTargets;
      await user.keyboard("{ArrowDown}");
      expect(screen.getByRole(role, { name: first })).toHaveFocus();

      if (second) {
        await user.keyboard("{ArrowDown}");
        expect(screen.getByRole(role, { name: second })).toHaveFocus();
      }
    });
  });
});
