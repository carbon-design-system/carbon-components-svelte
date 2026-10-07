import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import InlineNotificationFocusReturn from "./InlineNotificationFocusReturn.test.svelte";

describe("InlineNotification focus return", () => {
  it("returns focus to where it came from after closing with the close button", async () => {
    render(InlineNotificationFocusReturn);

    const before = screen.getByRole("button", { name: "Before" });
    before.focus();
    await user.tab();
    await user.tab();
    expect(
      screen.getByRole("button", { name: "Close notification" }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(before).toHaveFocus();
  });

  it("returns focus when an action button closes it through `open`", async () => {
    render(InlineNotificationFocusReturn);

    const before = screen.getByRole("button", { name: "Before" });
    before.focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();

    await user.keyboard("{Enter}");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(before).toHaveFocus();
  });
});
