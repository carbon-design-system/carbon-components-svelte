import { render, screen, waitFor } from "@testing-library/svelte";
import { tick } from "svelte";
import { createItems } from "../utils/create-items";
import { user } from "../utils/user";
import { openMenu } from "./helpers";
import MultiSelect from "./MultiSelect.test.svelte";
import MultiSelectInModal from "./MultiSelectInModal.test.svelte";

describe("MultiSelect", () => {
  // Shared windowing behavior is in tests/ListBox/family/virtualize.test.ts.
  describe("virtualization", () => {
    it("sorts the selected item to the top of the window", async () => {
      render(MultiSelect, {
        props: {
          items: createItems(500),
          selectedIds: ["250"],
          virtualize: true,
        },
      });

      await openMenu();

      const menu = screen.getByRole("listbox");
      await waitFor(() => {
        const first = screen.getAllByRole("option")[0];
        expect(first).toHaveAccessibleName("Item 251");
        expect(first).toHaveAttribute("aria-selected", "true");
        expect(first).toHaveAttribute("aria-posinset", "1");
      });
      expect(menu.scrollTop).toBe(0);
    });

    // Regression: with virtualization, the data-last item is not mounted
    // until scrolled into view, so a per-item blur handler bound to it
    // never fires when focus leaves the menu. The menu must close based
    // on focus leaving the wrapper, not blur of a specific list index.
    it("closes menu when focus moves outside the wrapper (virtualized)", async () => {
      const largeItems = createItems(500);
      render(MultiSelect, {
        props: { items: largeItems, virtualize: true },
      });

      const externalButton = document.createElement("button");
      externalButton.textContent = "Outside";
      document.body.appendChild(externalButton);

      try {
        await openMenu();
        const combobox = screen.getByRole("combobox");
        expect(combobox).toHaveAttribute("aria-expanded", "true");

        // The data-last item (index 499) is far below the viewport and
        // not mounted, so any close logic tied to it cannot fire.
        const visibleOptions = screen.getAllByRole("option");
        expect(visibleOptions.length).toBeLessThan(500);

        externalButton.focus();
        await tick();

        expect(combobox).toHaveAttribute("aria-expanded", "false");
      } finally {
        externalButton.remove();
      }
    });
  });

  describe("portalMenu", () => {
    afterEach(() => {
      const existingPortals = document.querySelectorAll(
        "[data-floating-portal]",
      );
      for (const portal of existingPortals) {
        portal.remove();
      }
    });

    it("should render menu in FloatingPortal when portalMenu is true", () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "0", text: "Slack" },
            { id: "1", text: "Email" },
          ],
          portalMenu: true,
          open: true,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should render menu in FloatingPortal when inside Modal (portalMenu not passed)", () => {
      render(MultiSelectInModal, {
        props: { modalOpen: true, multiSelectOpen: true },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).toBeInTheDocument();
      expect(floatingPortal?.parentElement).toBe(document.body);
    });

    it("should not render menu in FloatingPortal when inside Modal with portalMenu=false", () => {
      render(MultiSelectInModal, {
        props: {
          modalOpen: true,
          multiSelectOpen: true,
          portalMenu: false,
        },
      });

      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      const floatingPortal = menu.closest("[data-floating-portal]");
      expect(floatingPortal).not.toBeInTheDocument();
    });

    // Regression: when portaled, the menu loses its `.bx--multi-select`
    // ancestor, so descendant CSS rules (e.g. checkbox-wrapper sizing) stop
    // matching and the checkbox/label visually shift down inside each row.
    // The menu must be wrapped with `bx--multi-select bx--list-box--expanded`
    // so those selectors keep matching.
    it("should wrap portaled menu with multi-select host classes", () => {
      render(MultiSelect, {
        props: {
          items: [{ id: "0", text: "Slack" }],
          portalMenu: true,
          open: true,
        },
      });

      const menu = screen.getByRole("listbox");
      const host = menu.parentElement;
      expect(host).toHaveClass("bx--multi-select");
      expect(host).toHaveClass("bx--list-box--expanded");
      expect(host?.parentElement).toHaveAttribute("data-floating-portal");
    });

    it("should close portaled menu when clicking outside", async () => {
      render(MultiSelect, {
        props: {
          items: [
            { id: "0", text: "Slack" },
            { id: "1", text: "Email" },
          ],
          portalMenu: true,
        },
      });

      await openMenu();
      const menu = screen.getByRole("listbox");
      expect(menu).toBeInTheDocument();
      expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
        document.body,
      );

      await user.click(document.body);
      expect(screen.getByRole("combobox")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    it("should close portaled menu when focus moves outside", async () => {
      const externalButton = document.createElement("button");
      externalButton.textContent = "Outside";
      document.body.appendChild(externalButton);

      try {
        render(MultiSelect, {
          props: {
            items: [
              { id: "0", text: "Slack" },
              { id: "1", text: "Email" },
            ],
            portalMenu: true,
          },
        });

        await openMenu();
        const combobox = screen.getByRole("combobox");
        const menu = screen.getByRole("listbox");
        expect(combobox).toHaveAttribute("aria-expanded", "true");
        expect(menu.closest("[data-floating-portal]")?.parentElement).toBe(
          document.body,
        );

        externalButton.focus();
        await tick();

        expect(combobox).toHaveAttribute("aria-expanded", "false");
      } finally {
        externalButton.remove();
      }
    });
  });
});
