import { render, screen } from "@testing-library/svelte";
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
    render(ThemeControls, { props: { control: "select" } });
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
});
