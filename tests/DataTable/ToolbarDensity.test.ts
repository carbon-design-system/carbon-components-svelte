import { render, screen } from "@testing-library/svelte";
import Settings from "carbon-components-svelte/icons/Settings.svelte";
import { user } from "../utils/user";
import ToolbarDensity from "./ToolbarDensity.test.svelte";

describe("ToolbarDensity", () => {
  it("names the trigger and classes it as a toolbar action", () => {
    render(ToolbarDensity, { props: { standalone: true } });

    const trigger = screen.getByRole("button", { name: "Row height" });
    expect(trigger).toHaveClass("bx--toolbar-action");
  });

  it("renders the default icon, replaced by a custom icon prop", () => {
    const { container, unmount } = render(ToolbarDensity, {
      props: { standalone: true },
    });
    expect(container.querySelector("svg")?.innerHTML).toContain("M4 18 15 18");
    unmount();

    const { container: withCustomIcon } = render(ToolbarDensity, {
      props: { standalone: true, icon: Settings },
    });
    expect(withCustomIcon.querySelector("svg")?.innerHTML).toContain(
      "M27,16.76",
    );
  });

  it("shows every size as an ordered menuitemradio on open", async () => {
    render(ToolbarDensity, { props: { standalone: true } });

    await user.click(screen.getByRole("button", { name: "Row height" }));

    expect(
      screen
        .getAllByRole("menuitemradio")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["Compact", "Short", "Medium", "Tall"]);
  });

  it("checks the item matching the parent DataTable's size without a size prop", async () => {
    render(ToolbarDensity, { props: { tableSize: "short" } });

    await user.click(screen.getByRole("button", { name: "Row height" }));

    expect(
      screen.getByRole("menuitemradio", { name: "Short" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("sets the bound size and dispatches change when an item is picked", async () => {
    const consoleLog = vi.spyOn(console, "log");
    render(ToolbarDensity, { props: { standalone: true } });

    await user.click(screen.getByRole("button", { name: "Row height" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Tall" }));

    expect(screen.getByText("Size: tall")).toBeInTheDocument();
    expect(consoleLog).toHaveBeenCalledWith("change", { size: "tall" });
  });

  it("renders only the sizes given", async () => {
    render(ToolbarDensity, {
      props: { standalone: true, sizes: ["compact", "tall"] },
    });

    await user.click(screen.getByRole("button", { name: "Row height" }));

    expect(
      screen
        .getAllByRole("menuitemradio")
        .map((item) => item.textContent?.trim()),
    ).toEqual(["Compact", "Tall"]);
  });

  it("uses formatLabel for the item text", async () => {
    render(ToolbarDensity, {
      props: {
        standalone: true,
        formatLabel: (size: string) => size.toUpperCase(),
      },
    });

    await user.click(screen.getByRole("button", { name: "Row height" }));

    expect(
      screen.getByRole("menuitemradio", { name: "COMPACT" }),
    ).toBeInTheDocument();
  });

  const toolbarSizeCases: Array<
    ["compact" | "short" | "medium" | "tall" | undefined, string[]]
  > = [
    [undefined, ["bx--menu--lg"]],
    ["compact", ["bx--menu--xs"]],
    // "short" (a small toolbar's trigger width) has no size class of its
    // own; Menu's unclassed base rule already matches it (32px).
    ["short", []],
  ];

  it.each(toolbarSizeCases)(
    "matches the menu's seam-hiding bridge width to a %s table's toolbar",
    async (tableSize, expectedClasses) => {
      render(ToolbarDensity, { props: { tableSize } });

      await user.click(screen.getByRole("button", { name: "Row height" }));

      const menu = screen.getByRole("menu");
      for (const className of [
        "bx--menu--xs",
        "bx--menu--md",
        "bx--menu--lg",
      ]) {
        if (expectedClasses.includes(className)) {
          expect(menu).toHaveClass(className);
        } else {
          expect(menu).not.toHaveClass(className);
        }
      }
    },
  );

  it("checks Medium by default standalone in a bare Toolbar", async () => {
    render(ToolbarDensity, { props: { standalone: true } });

    await user.click(screen.getByRole("button", { name: "Row height" }));

    expect(
      screen.getByRole("menuitemradio", { name: "Medium" }),
    ).toHaveAttribute("aria-checked", "true");
  });
});
