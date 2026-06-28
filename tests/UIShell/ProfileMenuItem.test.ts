import { render, screen } from "@testing-library/svelte";
import ProfileMenuItem from "./ProfileMenuItem.test.svelte";

describe("ProfileMenuItem", () => {
  it("renders the icon prop, omitting the icon when unset", () => {
    render(ProfileMenuItem);

    const withIcon = screen.getByTestId("with-icon");
    expect(withIcon.querySelector("svg")).toBeInTheDocument();

    const noIcon = screen.getByTestId("no-icon");
    expect(noIcon.querySelector("svg")).toBeNull();
  });
});
