import { render, screen } from "@testing-library/svelte";
import ComposedModalLazy from "./ComposedModalLazy.test.svelte";

describe("ComposedModal lazy", () => {
  it("builds the content on first open, focuses it, and keeps it", async () => {
    const { rerender } = render(ComposedModalLazy, { open: false });

    expect(screen.queryByText("Rename project")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();

    await rerender({ open: true });
    const input = screen.getByLabelText("Name");
    await vi.waitFor(() => expect(input).toHaveFocus());
    expect(
      screen.getByRole("dialog", { name: "Rename project" }),
    ).toBeInTheDocument();

    await rerender({ open: false });
    expect(screen.getByLabelText("Name", { selector: "input" })).toBe(input);
  });
});
