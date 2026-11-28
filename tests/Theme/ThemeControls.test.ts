import { render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ThemeControls from "./ThemeControls.test.svelte";

const appliedTheme = () => document.documentElement.getAttribute("theme");

describe("Theme controls", () => {
  it("ThemeToggle switches between its two themes", async () => {
    render(ThemeControls, { props: { control: "toggle" } });

    await user.click(screen.getByRole("switch", { name: "Dark mode" }));
    expect(appliedTheme()).toBe("g100");
  });

  it("ThemeSelect lists its themes and applies the one picked", async () => {
    render(ThemeControls, {
      props: {
        control: "select",
        controlProps: { themes: ["white", "g90", "g100"] },
      },
    });
    const select = screen.getByRole("combobox", { name: "Themes" });

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "White",
      "Gray 90",
      "Gray 100",
    ]);
    await user.selectOptions(select, "g90");
    expect(appliedTheme()).toBe("g90");
  });

  it("ThemeDropdown applies the theme picked", async () => {
    render(ThemeControls, { props: { control: "dropdown" } });

    await user.click(screen.getByRole("combobox", { name: /Themes/ }));
    await user.click(screen.getByText("Gray 10"));
    expect(appliedTheme()).toBe("g10");
  });

  it("ThemeContentSwitcher shows its themes and applies the one picked", async () => {
    render(ThemeControls, {
      props: {
        control: "content-switcher",
        controlProps: { themes: ["white", "g90", "g100"] },
      },
    });
    const tablist = screen.getByRole("tablist", { name: "Themes" });

    expect(
      within(tablist)
        .getAllByRole("tab")
        .map((tab) => tab.textContent?.trim()),
    ).toEqual(["White", "Gray 90", "Gray 100"]);
    await user.click(screen.getByRole("tab", { name: "Gray 90" }));
    expect(appliedTheme()).toBe("g90");

    await user.keyboard("{ArrowRight}");
    expect(appliedTheme()).toBe("g100");
    expect(screen.getByRole("tab", { name: "Gray 100" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("ThemeContentSwitcher follows a theme set from outside", async () => {
    const { component } = render(ThemeControls, {
      props: {
        control: "content-switcher",
        controlProps: { themes: ["white", "g100"] },
      },
    });
    const tab = (name: string) => screen.getByRole("tab", { name });
    // Switches register a microtask after mount.
    await tick();

    component.theme = "g100";
    await tick();
    expect(tab("Gray 100")).toHaveAttribute("aria-selected", "true");
    expect(tab("White")).toHaveAttribute("aria-selected", "false");

    // A theme it doesn't list leaves the selection alone and isn't overwritten.
    component.theme = "g80";
    await tick();
    expect(component.theme).toBe("g80");
    expect(tab("Gray 100")).toHaveAttribute("aria-selected", "true");

    await user.click(tab("Gray 100"));
    expect(component.theme).toBe("g100");
  });
});
