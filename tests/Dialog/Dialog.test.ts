import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import Dialog from "./Dialog.test.svelte";

describe("Dialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a closed dialog by default", () => {
    render(Dialog);

    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute(
      "open",
    );
  });

  it("calls showModal() when modal is true and open becomes true", async () => {
    const showModalSpy = vi.spyOn(HTMLDialogElement.prototype, "showModal");

    const { rerender } = render(Dialog, { props: { modal: true } });
    rerender({ modal: true, open: true });
    await tick();

    expect(showModalSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("calls show() when modal is false and open becomes true", async () => {
    const showSpy = vi.spyOn(HTMLDialogElement.prototype, "show");

    const { rerender } = render(Dialog, { props: { modal: false } });
    rerender({ modal: false, open: true });
    await tick();

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("dispatches an open event when the dialog opens", async () => {
    const onopen = vi.fn();
    const { rerender } = render(Dialog, { props: { onopen } });
    rerender({ open: true, onopen });
    await tick();

    expect(onopen).toHaveBeenCalledTimes(1);
  });

  it("calls close() on the dialog element when open is set back to false", async () => {
    const closeSpy = vi.spyOn(HTMLDialogElement.prototype, "close");

    const { rerender } = render(Dialog, { props: { open: true } });
    rerender({ open: false });
    await tick();

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("dispatches a close event and syncs open to false when the browser closes the dialog", () => {
    const onclose = vi.fn();
    render(Dialog, { props: { open: true, onclose } });

    const dialogEl = screen.getByRole("dialog") as HTMLDialogElement;
    dialogEl.close();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(dialogEl).not.toHaveAttribute("open");
  });
});
