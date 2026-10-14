import { render, screen } from "@testing-library/svelte";
import SearchMenu from "carbon-components-svelte/SearchMenu/SearchMenu.svelte";

describe("SearchMenu aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(SearchMenu, {
      props: {
        labelText: "Search",
        readonly: true,
        readonlyText: "Read-only",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("combobox");
    expect(field).toHaveAccessibleDescription("Read-only");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
