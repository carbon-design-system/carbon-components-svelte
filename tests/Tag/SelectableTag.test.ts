import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import SelectableTag from "./SelectableTag.test.svelte";

describe("SelectableTag", () => {
  it("exposes the selected state via aria-pressed and toggles on click", async () => {
    render(SelectableTag);

    const tag = screen.getByRole("button", { name: "Default" });
    expect(tag).toHaveAttribute("aria-pressed", "false");
    expect(tag).not.toHaveAttribute("role", "checkbox");
    expect(tag).not.toHaveAttribute("aria-checked");

    await user.click(tag);
    expect(tag).toHaveAttribute("aria-pressed", "true");

    await user.click(tag);
    expect(tag).toHaveAttribute("aria-pressed", "false");
  });

  it("reflects an initially `selected` prop on aria-pressed", () => {
    render(SelectableTag);

    const tag = screen.getByRole("button", { name: "Preselected" });
    expect(tag).toHaveAttribute("aria-pressed", "true");
  });
});
