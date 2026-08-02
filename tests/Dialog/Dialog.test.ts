import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
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

  it('dispatches close with trigger "programmatic" when open is set to false', async () => {
    const onclose = vi.fn();
    const { rerender } = render(Dialog, { props: { open: true, onclose } });
    rerender({ open: false, onclose });
    await tick();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({
      trigger: "programmatic",
    });
  });

  it('dispatches close with trigger "escape-key" when Escape closes the dialog', () => {
    const onclose = vi.fn();
    render(Dialog, { props: { open: true, modal: true, onclose } });

    const dialogEl = screen.getByRole("dialog") as HTMLDialogElement;
    dialogEl.dispatchEvent(new Event("cancel"));
    dialogEl.close();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({
      trigger: "escape-key",
    });
  });

  it('dispatches close with trigger "backdrop" when clicking the backdrop', async () => {
    const onclose = vi.fn();
    render(Dialog, { props: { open: true, modal: true, onclose } });

    const dialogEl = screen.getByRole("dialog");
    await user.click(dialogEl);

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({
      trigger: "backdrop",
    });
  });

  it("does not close on backdrop click when preventCloseOnClickOutside is set", async () => {
    const onclose = vi.fn();
    render(Dialog, {
      props: {
        open: true,
        modal: true,
        preventCloseOnClickOutside: true,
        onclose,
      },
    });

    const dialogEl = screen.getByRole("dialog");
    await user.click(dialogEl);

    expect(onclose).not.toHaveBeenCalled();
    expect(dialogEl).toHaveAttribute("open");
  });

  it('dispatches close with trigger "close-button" when dialog.close() is called', async () => {
    const onclose = vi.fn();
    render(Dialog, { props: { open: true, modal: true, onclose } });

    await user.click(screen.getByTestId("close-button"));

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({
      trigger: "close-button",
    });
  });

  it("restores focus to the opener when the dialog closes", async () => {
    render(Dialog, { props: { modal: true } });

    const opener = screen.getByTestId("opener");
    opener.focus();
    await user.click(opener);
    await tick();

    expect(screen.getByRole("dialog")).toHaveAttribute("open");

    await user.keyboard("{Escape}");
    await tick();

    expect(opener).toHaveFocus();
  });

  it("dispatches a close event and syncs open to false when the browser closes the dialog", () => {
    const onclose = vi.fn();
    render(Dialog, { props: { open: true, onclose } });

    const dialogEl = screen.getByRole("dialog") as HTMLDialogElement;
    dialogEl.close();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({
      trigger: "close-button",
    });
    expect(dialogEl).not.toHaveAttribute("open");
  });
});
