import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import HeaderNavMenuInsert from "./HeaderNavMenuInsert.test.svelte";

const item = (name: string) => screen.getByRole("menuitem", { name });
const trigger = () => item("Products");

describe("HeaderNavMenu items inserted after mount", () => {
  it("navigates and closes in DOM order", async () => {
    const { component } = render(HeaderNavMenuInsert);
    component.showFirst = true;
    await tick();

    item("Compute").focus();
    await user.keyboard("{ArrowUp}");
    expect(item("First")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(item("Storage")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(item("First")).toHaveFocus();

    // "First" registered last but is not the last item on screen, so leaving
    // it must not close the menu.
    const field = screen.getByRole("textbox", { name: "Search docs" });
    field.focus();
    await tick();
    expect(field).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");

    // The last item on screen does close it.
    item("Storage").focus();
    field.focus();
    await tick();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});
