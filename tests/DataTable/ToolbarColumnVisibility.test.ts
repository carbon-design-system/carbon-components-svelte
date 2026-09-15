import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarColumnVisibilityTest from "./ToolbarColumnVisibility.test.svelte";

function headersSnapshot() {
  return screen.getByTestId("headers-snapshot").textContent?.trim();
}

describe("ToolbarColumnVisibility", () => {
  it("renders the trigger with an accessible name and aria-expanded false", () => {
    render(ToolbarColumnVisibilityTest);

    const trigger = screen.getByRole("button", { name: "Column visibility" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  const toolbarSizeCases: Array<
    ["default" | "sm" | "xs" | undefined, string[]]
  > = [
    [undefined, ["bx--menu--lg"]],
    // "sm" (a small/short toolbar's trigger width) has no size class of its
    // own; Menu's unclassed base rule already matches it (32px).
    ["sm", []],
    ["xs", ["bx--menu--xs"]],
  ];

  it.each(toolbarSizeCases)(
    "matches the menu's seam-hiding bridge width to a %s toolbar's trigger",
    async (toolbarSize, expectedClasses) => {
      render(ToolbarColumnVisibilityTest, { props: { toolbarSize } });

      await user.click(
        screen.getByRole("button", { name: "Column visibility" }),
      );

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

  it("opens a menu listing one item per non-empty header", async () => {
    render(ToolbarColumnVisibilityTest);

    await user.click(screen.getByRole("button", { name: "Column visibility" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Protocol" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Port" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitemcheckbox", { name: "actions" }),
    ).toBeNull();
  });

  it("unchecking a column hides it on the bound array and dispatches change", async () => {
    const change = vi.fn();
    render(ToolbarColumnVisibilityTest, { props: { change } });

    await user.click(screen.getByRole("button", { name: "Column visibility" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Port" }));

    expect(headersSnapshot()).toBe(
      JSON.stringify([
        ["name", false],
        ["protocol", false],
        ["port", true],
        ["actions", false],
      ]),
    );
    expect(change).toHaveBeenCalledTimes(1);
    expect(change.mock.calls[0][0].detail.settings.hidden).toEqual(["port"]);
  });

  it("keeps the menu open after toggling a column", async () => {
    render(ToolbarColumnVisibilityTest);

    const trigger = screen.getByRole("button", { name: "Column visibility" });
    await user.click(trigger);
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Port" }));

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("disables the item of the last visible column", async () => {
    render(ToolbarColumnVisibilityTest);

    await user.click(screen.getByRole("button", { name: "Column visibility" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Name" }));
    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Protocol" }),
    );

    expect(
      screen.getByRole("menuitemcheckbox", { name: "Port" }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("closes on Escape and focuses the trigger", async () => {
    render(ToolbarColumnVisibilityTest);

    const trigger = screen.getByRole("button", { name: "Column visibility" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on an outside click", async () => {
    render(ToolbarColumnVisibilityTest);

    const trigger = screen.getByRole("button", { name: "Column visibility" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.click(document.body);

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("hides the column in the DataTable after a toggle", async () => {
    render(ToolbarColumnVisibilityTest);

    expect(
      screen.getByRole("columnheader", { name: "Name" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Column visibility" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Name" }));

    expect(screen.queryByRole("columnheader", { name: "Name" })).toBeNull();
    expect(
      screen.getByRole("columnheader", { name: "Protocol" }),
    ).toBeInTheDocument();
  });

  it("limits the menu to toggleableKeys, omitting the rest", async () => {
    render(ToolbarColumnVisibilityTest, {
      props: { toggleableKeys: ["protocol", "port"] },
    });

    await user.click(screen.getByRole("button", { name: "Column visibility" }));

    expect(screen.queryByRole("menuitemcheckbox", { name: "Name" })).toBeNull();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Protocol" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Port" }),
    ).toBeInTheDocument();
  });

  it("leaves a non-toggleable column's visibility unaffected by other toggles", async () => {
    render(ToolbarColumnVisibilityTest, {
      props: { toggleableKeys: ["protocol", "port"] },
    });

    await user.click(screen.getByRole("button", { name: "Column visibility" }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Port" }));

    expect(headersSnapshot()).toBe(
      JSON.stringify([
        ["name", false],
        ["protocol", false],
        ["port", true],
        ["actions", false],
      ]),
    );
  });
});
