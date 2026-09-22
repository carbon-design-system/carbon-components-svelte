import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarSearchSearchEvent from "./ToolbarSearchSearchEvent.test.svelte";

describe("ToolbarSearch search event", () => {
  it("forwards the search event dispatched on Enter", async () => {
    const onSearch = vi.fn();
    render(ToolbarSearchSearchEvent, { props: { onSearch } });

    const input = screen.getByRole("searchbox");
    await user.type(input, "Balancer 1{Enter}");

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("Balancer 1");
  });
});
