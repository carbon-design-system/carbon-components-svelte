import { render, screen, within } from "@testing-library/svelte";
import { user } from "../utils/user";
import PermissionsMatrix from "./PermissionsMatrix.test.svelte";

/** A boolean cell: a checkbox named by its row and column headers. */
const box = (name: string | RegExp) => screen.getByRole("checkbox", { name });
/** A level cell: a gridcell that reads its level from its text. */
const levelCell = (name: string | RegExp) =>
  screen.getByRole("gridcell", { name });
const stored = () =>
  JSON.parse(screen.getByTestId("value").textContent as string);
const status = () => screen.getByRole("status");

function focusBox(name: string | RegExp) {
  const target = box(name);
  target.focus();
  return target;
}

describe("PermissionsMatrix", () => {
  describe("semantics", () => {
    it("is a grid with a checkbox per cell, named by the row and column headers", () => {
      render(PermissionsMatrix);

      const grid = screen.getByRole("grid", { name: "Role permissions" });
      expect(grid).toHaveAttribute("aria-rowcount", "8");
      expect(grid).toHaveAttribute("aria-colcount", "4");
      expect(box("Billing, View invoices Viewer")).toBeChecked();
      expect(box("Billing, Pay invoices Viewer")).not.toBeChecked();
      expect(
        screen.getByRole("columnheader", {
          name: "Editor Inherits from Viewer",
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("rowheader", { name: "Billing" }),
      ).toHaveAttribute("aria-expanded", "true");
    });

    it("has one tab stop", () => {
      render(PermissionsMatrix);

      const stops = screen.getByRole("grid").querySelectorAll('[tabindex="0"]');
      expect(stops).toHaveLength(1);
      expect(stops[0]).toBe(box("Billing Viewer"));
    });

    it("exposes a group cell as mixed when its children differ", () => {
      render(PermissionsMatrix);

      expect(box("Billing Viewer")).toBePartiallyChecked();
      expect(box("Team Viewer")).toBePartiallyChecked();
      expect(box("Audit log Viewer")).not.toBePartiallyChecked();
    });

    it("describes what the cell inherits, changes and locks", async () => {
      render(PermissionsMatrix, {
        props: {
          lockReason: (role: { id: string }) =>
            role.id === "admin" ? "Managed by SSO" : undefined,
        },
      });

      expect(box("Billing, View invoices Editor")).toHaveAccessibleDescription(
        "Inherited from Viewer",
      );
      expect(box("Audit log Admin")).toHaveAccessibleDescription(
        "Locked: Managed by SSO",
      );
      await user.click(box("Audit log Viewer"));
      expect(box("Audit log Viewer")).toHaveAccessibleDescription("Changed");
    });
  });

  describe("keyboard", () => {
    it("moves between cells with the arrows and keeps one tab stop", async () => {
      render(PermissionsMatrix);

      focusBox("Billing, View invoices Viewer");
      await user.keyboard("{ArrowRight}");
      expect(box("Billing, View invoices Editor")).toHaveFocus();
      await user.keyboard("{ArrowDown}");
      expect(box("Billing, Pay invoices Editor")).toHaveFocus();

      const stops = screen.getByRole("grid").querySelectorAll('[tabindex="0"]');
      expect(stops).toHaveLength(1);
      expect(stops[0]).toHaveFocus();
    });

    it("reaches the headers, and jumps with Home, End and Ctrl", async () => {
      render(PermissionsMatrix);

      focusBox("Billing, View invoices Viewer");
      await user.keyboard("{ArrowUp}{ArrowUp}");
      expect(
        screen.getByRole("columnheader", { name: "Viewer" }),
      ).toHaveFocus();
      await user.keyboard("{Home}");
      expect(
        screen.getByRole("columnheader", { name: "Permissions" }),
      ).toHaveFocus();
      await user.keyboard("{Control>}{End}{/Control}");
      expect(box("Audit log Admin")).toHaveFocus();
    });

    it("swaps the horizontal arrows under dir=rtl", async () => {
      document.documentElement.dir = "rtl";
      try {
        render(PermissionsMatrix);

        focusBox("Billing, View invoices Viewer");
        await user.keyboard("{ArrowRight}");
        expect(
          screen.getByRole("rowheader", { name: "Billing, View invoices" }),
        ).toHaveFocus();
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    });
  });

  describe("editing", () => {
    it("toggles a cell with Space and dispatches change", async () => {
      const { component } = render(PermissionsMatrix);

      focusBox("Billing, Pay invoices Viewer");
      await user.keyboard(" ");

      expect(stored().viewer["billing.pay"]).toBe(true);
      expect(box("Billing, Pay invoices Viewer")).toBeChecked();
      expect(component.events).toEqual(["change:1"]);
    });

    it("overrides an inherited cell, and flipping it back inherits again", async () => {
      render(PermissionsMatrix);

      focusBox("Billing, View invoices Admin");
      expect(box("Billing, View invoices Admin")).toBeChecked();
      await user.keyboard(" ");
      expect(stored().admin).toEqual({ "billing.view": false });
      expect(box("Billing, View invoices Admin")).not.toBeChecked();
      expect(box("Billing, View invoices Admin")).toHaveAccessibleDescription(
        "Revoked here, Changed",
      );

      await user.keyboard(" ");
      expect(stored().admin).toBeUndefined();
      expect(box("Billing, View invoices Admin")).toBeChecked();
    });

    it("reverts an override with Delete", async () => {
      render(PermissionsMatrix);

      focusBox("Billing, Pay invoices Editor");
      await user.keyboard("{Delete}");

      expect(stored().editor).toBeUndefined();
      expect(box("Billing, Pay invoices Editor")).not.toBeChecked();
    });

    it("grants every child from a mixed group cell, then clears them", async () => {
      render(PermissionsMatrix);

      focusBox("Billing Viewer");
      await user.keyboard(" ");
      expect(stored().viewer).toMatchObject({
        "billing.view": true,
        "billing.pay": true,
      });
      expect(box("Billing Viewer")).toBeChecked();

      await user.keyboard(" ");
      expect(stored().viewer["billing.pay"]).toBeUndefined();
      expect(box("Billing Viewer")).not.toBeChecked();
    });

    it("toggles a cell on click", async () => {
      render(PermissionsMatrix);

      await user.click(box("Audit log Viewer"));

      expect(stored().viewer.audit).toBe(true);
      expect(box("Audit log Viewer")).toHaveFocus();
    });
  });

  describe("locked cells", () => {
    it("ignores edits to a locked cell", async () => {
      render(PermissionsMatrix, {
        props: {
          lockReason: (role: { id: string }, permission: { id: string }) =>
            role.id === "admin" && permission.id === "audit"
              ? "Required by SOC 2"
              : undefined,
        },
      });

      const locked = box("Audit log Admin");
      expect(locked).toHaveAttribute("aria-readonly", "true");
      locked.focus();
      await user.keyboard(" ");
      await user.click(locked);

      expect(stored().admin).toBeUndefined();
    });

    it("keeps a locked child out of a group edit", async () => {
      render(PermissionsMatrix, {
        props: {
          permissions: [
            {
              id: "billing",
              label: "Billing",
              children: [
                { id: "billing.view", label: "View invoices" },
                { id: "billing.pay", label: "Pay invoices", locked: "Managed" },
              ],
            },
          ],
          value: {},
        },
      });

      focusBox("Billing Viewer");
      await user.keyboard(" ");

      expect(stored().viewer).toEqual({ "billing.view": true });
    });

    it("locks a whole group's children when the group is locked", () => {
      render(PermissionsMatrix, {
        props: {
          permissions: [
            {
              id: "billing",
              label: "Billing",
              locked: "Finance only",
              children: [{ id: "billing.view", label: "View invoices" }],
            },
          ],
          value: {},
        },
      });

      expect(box("Billing, View invoices Viewer")).toHaveAttribute(
        "aria-readonly",
        "true",
      );
    });
  });

  describe("saved state", () => {
    it("counts changes against the saved value and discards them", async () => {
      const { component } = render(PermissionsMatrix);
      expect(status()).toHaveTextContent("No changes");

      await user.click(box("Audit log Viewer"));
      await user.click(box("Audit log Editor"));
      expect(status()).toHaveTextContent("2 changes");

      await user.click(screen.getByRole("button", { name: "Discard" }));
      expect(status()).toHaveTextContent("No changes");
      expect(stored().viewer.audit).toBeUndefined();
      expect(component.events).toContain("discard");
    });

    it("saves: the current value becomes the saved state", async () => {
      const { component } = render(PermissionsMatrix);

      await user.click(box("Audit log Viewer"));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(component.events).toContain("save:1");
      expect(status()).toHaveTextContent("No changes");
      expect(component.saved).toEqual(component.value);
    });

    it("keeps changes pending when save is canceled", async () => {
      render(PermissionsMatrix, { props: { hold: true } });

      await user.click(box("Audit log Viewer"));
      await user.click(screen.getByRole("button", { name: "Save changes" }));

      expect(status()).toHaveTextContent("1 change");
    });

    it("follows a saved value the consumer sets", async () => {
      const { rerender } = render(PermissionsMatrix);

      await user.click(box("Audit log Viewer"));
      expect(status()).toHaveTextContent("1 change");
      await rerender({ saved: stored() });

      expect(status()).toHaveTextContent("No changes");
    });
  });

  describe("levels", () => {
    const levels = ["none", "read", "write", "admin"];

    it("steps a cell through the levels and back with Shift", async () => {
      render(PermissionsMatrix, {
        props: { levels, value: { viewer: { audit: "read" } } },
      });

      levelCell("Audit log Viewer read").focus();
      await user.keyboard(" ");
      expect(stored().viewer.audit).toBe("write");
      await user.keyboard("{Shift>}{Enter}{/Shift}{Shift>}{Enter}{/Shift}");
      // The lowest level is what a root role takes with no entry.
      expect(stored().viewer).toBeUndefined();
      expect(levelCell("Audit log Viewer none")).toBeInTheDocument();
    });

    it("inherits a parent's level", () => {
      render(PermissionsMatrix, {
        props: { levels, value: { viewer: { audit: "write" } } },
      });

      const cell = levelCell("Audit log Admin write");
      expect(cell).toHaveAccessibleDescription("Inherited from Viewer");
    });

    it("shows a group's level when its children agree, and Mixed when not", () => {
      render(PermissionsMatrix, {
        props: { levels, value: { viewer: { "billing.view": "read" } } },
      });

      expect(levelCell("Billing Viewer Mixed")).toBeInTheDocument();
      expect(levelCell("Team Viewer none")).toBeInTheDocument();
    });
  });

  describe("groups", () => {
    it("collapses a group with Enter on its header", async () => {
      const { component } = render(PermissionsMatrix);

      screen.getByRole("rowheader", { name: "Billing" }).focus();
      await user.keyboard("{Enter}");

      expect(component.collapsedIds).toEqual(["billing"]);
      expect(
        screen.getByRole("rowheader", { name: "Billing" }),
      ).toHaveAttribute("aria-expanded", "false");
      expect(
        screen.queryByRole("rowheader", { name: "Billing, View invoices" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "6");
    });

    it("starts with the groups in collapsedIds collapsed", () => {
      render(PermissionsMatrix, { props: { collapsedIds: ["team"] } });

      expect(
        screen.queryByRole("rowheader", { name: "Team, Invite members" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("rowheader", { name: "Billing, View invoices" }),
      ).toBeInTheDocument();
    });
  });

  describe("bulk actions", () => {
    it("selects a column from its header and grants the selection", async () => {
      render(PermissionsMatrix);

      await user.click(
        screen.getByRole("columnheader", {
          name: "Admin Inherits from Editor",
        }),
      );
      expect(status()).toHaveTextContent("7 cells selected");

      await user.click(screen.getByRole("button", { name: "Grant" }));

      // The admin already inherits the other three, so only two write.
      expect(stored().admin).toEqual({ "team.invite": true, audit: true });
    });

    it("extends a selection with Shift+Arrow and applies Space to all of it", async () => {
      render(PermissionsMatrix);

      focusBox("Audit log Viewer");
      await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
      expect(status()).toHaveTextContent("2 cells selected");
      await user.keyboard(" ");

      expect(stored().viewer.audit).toBe(true);
      expect(stored().editor.audit).toBe(true);
    });

    it("clears the selection with Escape", async () => {
      render(PermissionsMatrix);

      focusBox("Audit log Viewer");
      await user.keyboard("{Shift>}{ArrowRight}{/Shift}{Escape}");

      expect(status()).toHaveTextContent("No changes");
    });
  });

  describe("transposed", () => {
    it("puts roles in rows and permissions in columns with the same cell names", () => {
      render(PermissionsMatrix, { props: { transposed: true } });

      expect(
        screen.getByRole("columnheader", { name: "Billing, View invoices" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("rowheader", { name: /^Viewer/ }),
      ).toBeInTheDocument();
      expect(box("Viewer Billing, View invoices")).toBeChecked();
      expect(
        screen.getByRole("columnheader", { name: "Billing" }),
      ).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("virtualize", () => {
    const roles = Array.from({ length: 40 }, (_, i) => ({
      id: `r${i}`,
      label: `Role ${i}`,
    }));
    const permissions = Array.from({ length: 200 }, (_, i) => ({
      id: `p${i}`,
      label: `Permission ${i}`,
    }));
    const props = {
      roles,
      permissions,
      value: {},
      virtualize: true,
      height: 320,
    };

    it("paints a window and reports the full size", () => {
      render(PermissionsMatrix, { props });

      const grid = screen.getByRole("grid");
      expect(grid).toHaveAttribute("aria-rowcount", "201");
      expect(grid).toHaveAttribute("aria-colcount", "41");
      expect(within(grid).getAllByRole("row").length).toBeLessThan(30);
      expect(within(grid).getAllByRole("checkbox").length).toBeLessThan(600);
    });

    it("keeps the cell with focus painted when it leaves the window", async () => {
      render(PermissionsMatrix, { props });

      focusBox("Permission 0 Role 0");
      await user.keyboard("{Control>}{End}{/Control}");

      expect(box("Permission 199 Role 39")).toHaveFocus();
      expect(
        screen.getByRole("grid").querySelectorAll('[tabindex="0"]'),
      ).toHaveLength(1);
    });
  });
});
