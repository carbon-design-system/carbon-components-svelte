import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import PaginationFocusReturn from "./PaginationFocusReturn.test.svelte";

describe("Pagination focus after a nav button disables itself", () => {
  it("leaves focus where a change handler moved it", async () => {
    render(PaginationFocusReturn);

    const prevButton = screen.getByRole("button", { name: "Previous page" });
    prevButton.focus();
    await user.click(prevButton);
    await tick();

    expect(prevButton).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Elsewhere" })).toHaveFocus();
  });
});
