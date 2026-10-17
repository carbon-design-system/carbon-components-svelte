import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import ToolbarSearchHost from "./ToolbarSearchHost.test.svelte";

describe("ToolbarSearch clear()", () => {
  it("resets value and collapses the search", async () => {
    render(ToolbarSearchHost);

    const input = screen.getByRole("searchbox");
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

  it("keeps a persistent search expanded", async () => {
    render(ToolbarSearchHost, {
      props: { searchProps: { persistent: true }, expanded: true },
    });

    const input = screen.getByRole("searchbox");
    await fireEvent.input(input, { target: { value: "Bravo" } });
    expect(screen.getByTestId("value").textContent).toBe("Bravo");

    // Click without moving focus: blurring a persistent search collapses it
    // on its own, which would mask `clear()`.
    await fireEvent.click(screen.getByTestId("clear"));

    expect(screen.getByTestId("value").textContent).toBe("");
    const container = input.closest(".bx--toolbar-search-container-persistent");
    expect(container).not.toBeNull();
    expect(
      container?.classList.contains("bx--toolbar-search-container-active"),
    ).toBe(true);
  });
});
