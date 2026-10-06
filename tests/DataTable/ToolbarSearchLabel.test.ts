import { render, screen } from "@testing-library/svelte";
import ToolbarSearchLabel from "./ToolbarSearchLabel.test.svelte";

describe("ToolbarSearch label", () => {
  it("names the search field and landmark by default", () => {
    render(ToolbarSearchLabel);

    expect(
      screen.getByRole("searchbox", { name: "Search" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("search", { name: "Search" })).toBeInTheDocument();
  });

  it("uses a custom labelText", () => {
    render(ToolbarSearchLabel, { props: { labelText: "Filter servers" } });

    expect(
      screen.getByRole("searchbox", { name: "Filter servers" }),
    ).toBeInTheDocument();
  });
});
