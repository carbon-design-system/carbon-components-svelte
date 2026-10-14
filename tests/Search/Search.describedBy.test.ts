import { render, screen } from "@testing-library/svelte";
import Search from "carbon-components-svelte/Search/Search.svelte";

describe("Search aria-describedby", () => {
  it("joins a consumer aria-describedby with the built-in description", () => {
    render(Search, {
      props: {
        labelText: "Search",
        helperText: "Search by name",
        "aria-describedby": "extra-help",
      },
    });

    const field = screen.getByRole("searchbox");
    expect(field).toHaveAccessibleDescription("Search by name");
    expect(field).toHaveAttribute(
      "aria-describedby",
      expect.stringMatching(/^\S+ extra-help$/),
    );
  });
});
