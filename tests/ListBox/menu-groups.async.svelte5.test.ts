import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import GroupedMenu from "./GroupedMenu.async.svelte5.test.svelte";

const regions = [
  { id: "us-west-2", text: "US West (Oregon)", group: "Americas" },
  { id: "eu-west-1", text: "Europe (Ireland)", group: "Europe" },
  { id: "us-east-1", text: "US East (N. Virginia)", group: "Americas" },
];

const headerTexts = () =>
  Array.from(
    document.querySelectorAll(".bx--list-box__menu-group-header"),
    (header) => header.textContent?.trim(),
  );

// Svelte 5 only, compiled with `experimental.async` (see vite.config.ts).
describe("grouped menus in async mode", () => {
  it.each(["ComboBox", "Dropdown", "MultiSelect"] as const)(
    "%s drops a group whose items are removed",
    async (menu) => {
      const { rerender } = render(GroupedMenu, {
        props: { menu, items: regions },
      });

      await rerender({
        items: regions.filter((region) => region.group !== "Americas"),
      });

      expect(headerTexts()).toEqual(["Europe (1)"]);
    },
  );

  it.each(["ComboBox", "MultiSelect"] as const)(
    "%s drops a group the filter empties",
    async (menu) => {
      render(GroupedMenu, { props: { menu, items: regions } });

      await user.type(screen.getByRole("combobox"), "europe");

      expect(headerTexts()).toEqual(["Europe (1)"]);
    },
  );
});
