import { render, screen } from "@testing-library/svelte";
import ModalLazy from "./ModalLazy.test.svelte";

describe("Modal lazy", () => {
  it("builds the content on first open, focuses it, and keeps it", async () => {
    const { rerender } = render(ModalLazy, { open: false });

    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    // The heading still names the dialog.
    expect(screen.getByText("Rename project")).toBeInTheDocument();

    await rerender({ open: true });
    const input = screen.getByLabelText("Name");
    await vi.waitFor(() => expect(input).toHaveFocus());
    expect(screen.getByText("Save")).toBeInTheDocument();

    await rerender({ open: false });
    expect(screen.getByLabelText("Name")).toBe(input);
  });
});
