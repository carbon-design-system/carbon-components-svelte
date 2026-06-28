import { render, screen } from "@testing-library/svelte";
import ProfileMenuList from "./ProfileMenuList.test.svelte";

describe("ProfileMenuList", () => {
  it("renders a list group wrapping its items", () => {
    render(ProfileMenuList);

    const list = screen.getByTestId("list");
    expect(list).toHaveClass("bx--profile-menu__list");
    expect(list.querySelectorAll(".bx--profile-menu__item")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Settings" })).toBeInTheDocument();
  });
});
