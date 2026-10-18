import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ProfileMenuKeyboard from "./ProfileMenuKeyboard.test.svelte";

const item = (name: string) =>
  screen.getByRole(name === "Settings" ? "link" : "button", { name });

describe("ProfileMenu item keyboard navigation", () => {
  it("moves with ArrowDown and ArrowUp, wrapping at the ends", async () => {
    render(ProfileMenuKeyboard);

    item("Settings").focus();
    await user.keyboard("{ArrowDown}");
    expect(item("Log out")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(item("Settings")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Log out")).toHaveFocus();
  });

  it("navigates within a HeaderSwitcher without leaving it", async () => {
    render(ProfileMenuKeyboard);

    item("Acme Corp").focus();
    await user.keyboard("{ArrowUp}");
    expect(item("Initech")).toHaveFocus();
    await user.keyboard("{Home}{ArrowDown}");
    expect(item("Globex")).toHaveFocus();
  });
});
