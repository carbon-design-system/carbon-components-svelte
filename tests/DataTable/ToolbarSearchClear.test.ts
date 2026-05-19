import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarSearchClear from "./ToolbarSearchClear.test.svelte";

describe("ToolbarSearch clear()", () => {
  it("resets value and collapses the search", async () => {
    render(ToolbarSearchClear);

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await user.type(input, "Alpha");

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("Alpha");
    });

    const container = input.closest(".bx--toolbar-search-container-expandable");
    expect(
      container?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(true);

    await user.click(screen.getByTestId("clear"));

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("");
    });
    expect(
      container?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(false);
  });

  it("keeps the search expanded when persistent", async () => {
    render(ToolbarSearchClear, { props: { persistent: true } });

    const input = screen.getByRole("searchbox") as HTMLInputElement;
    await user.type(input, "Bravo");

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("Bravo");
    });

    await user.click(screen.getByTestId("clear"));

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("");
    });

    const container = input.closest(".bx--toolbar-search-container-persistent");
    expect(container).not.toBeNull();
  });
});
