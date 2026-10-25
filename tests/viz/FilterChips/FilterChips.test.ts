import { render, screen } from "@testing-library/svelte";
import { user } from "../../utils/user";
import FilterChips from "./FilterChips.test.svelte";

describe("FilterChips", () => {
  it("shows each filter as a tag that removes it, and clears them all", async () => {
    const onremove = vi.fn();
    render(FilterChips, { onremove });
    expect(screen.getByText("Region: EMEA")).toBeInTheDocument();
    expect(screen.getByText("product: Cloud")).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: /^Remove filter/ })[0],
    );
    expect(onremove).toHaveBeenCalledWith({
      dimension: "region",
      value: "EMEA",
    });
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
  });
});
