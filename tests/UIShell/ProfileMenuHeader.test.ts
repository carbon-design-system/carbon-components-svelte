import { render, screen } from "@testing-library/svelte";
import ProfileMenuHeader from "./ProfileMenuHeader.test.svelte";

describe("ProfileMenuHeader", () => {
  it("renders the view-profile text, customizable and optional", () => {
    render(ProfileMenuHeader);

    expect(
      screen.getByTestId("default").querySelector(".bx--profile-menu__view"),
    ).toHaveTextContent("View profile");
    expect(
      screen.getByTestId("custom").querySelector(".bx--profile-menu__view"),
    ).toHaveTextContent("Manage account");
    expect(
      screen.getByTestId("hidden").querySelector(".bx--profile-menu__view"),
    ).toBeNull();
  });
});
