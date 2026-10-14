import { render, screen } from "@testing-library/svelte";
import OverflowMenuItemAria from "./OverflowMenuItem.ariaForwarding.test.svelte";

describe("OverflowMenuItem aria forwarding", () => {
  afterEach(() => {
    for (const portal of document.querySelectorAll("[data-floating-portal]")) {
      portal.remove();
    }
  });

  describe.each([
    ["button", ""],
    ["link", "https://example.com"],
  ])("%s item", (_kind, href) => {
    it("places a consumer aria-describedby on the menuitem", () => {
      render(OverflowMenuItemAria, {
        props: { href, itemProps: { "aria-describedby": "extra-help" } },
      });

      const item = screen.getByRole("menuitem", { name: "Rename" });
      expect(item).toHaveAttribute("aria-describedby", "extra-help");
      expect(item).toHaveAccessibleDescription("Extra help");
      expect(document.getElementById("item")).not.toHaveAttribute(
        "aria-describedby",
      );
    });

    it("names the menuitem with a consumer aria-labelledby", () => {
      render(OverflowMenuItemAria, {
        props: { href, itemProps: { "aria-labelledby": "external-name" } },
      });

      expect(
        screen.getByRole("menuitem", { name: "External name" }),
      ).toBeInTheDocument();
      expect(document.getElementById("item")).not.toHaveAttribute(
        "aria-labelledby",
      );
    });

    it("names the menuitem with a consumer aria-label", () => {
      render(OverflowMenuItemAria, {
        props: { href, itemProps: { "aria-label": "Consumer label" } },
      });

      expect(
        screen.getByRole("menuitem", { name: "Consumer label" }),
      ).toBeInTheDocument();
      expect(document.getElementById("item")).not.toHaveAttribute("aria-label");
    });
  });
});
