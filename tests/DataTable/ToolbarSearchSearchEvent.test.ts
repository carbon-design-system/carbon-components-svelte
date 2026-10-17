import { render, screen } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarSearchHost from "./ToolbarSearchHost.test.svelte";

describe("ToolbarSearch search event", () => {
  it("forwards the search event dispatched on Enter", async () => {
    const onsearch = vi.fn();
    render(ToolbarSearchHost, {
      props: {
        rows: [
          { id: 1, name: "Balancer 1" },
          { id: 2, name: "Balancer 2" },
        ],
        searchProps: { persistent: true },
        onsearch,
      },
    });

    const input = screen.getByRole("searchbox");
    await user.type(input, "Balancer 1{Enter}");

    expect(onsearch).toHaveBeenCalledExactlyOnceWith("Balancer 1");
  });
});
