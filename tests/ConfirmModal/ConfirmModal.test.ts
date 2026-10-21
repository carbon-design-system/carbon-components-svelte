import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ConfirmModalTest from "./ConfirmModal.test.svelte";
import { isOpen } from "./helpers";

describe("ConfirmModal", () => {
  it("renders the heading and both buttons", () => {
    render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    });

    screen.getByRole("alertdialog");
    screen.getByText("Delete this item?");
    screen.getByRole("button", { name: "Delete" });
    screen.getByRole("button", { name: "Cancel" });
  });

  it("dispatches confirm and closes on confirm click", async () => {
    const onconfirm = vi.fn();
    const oncancel = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        confirmText: "Delete",
        onconfirm,
        oncancel,
      },
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onconfirm).toHaveBeenCalledTimes(1);
    await tick();
    await tick();
    expect(isOpen()).toBe(false);
    expect(oncancel).not.toHaveBeenCalled();
  });

  it("dispatches cancel with close-button trigger on the X", async () => {
    const oncancel = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        oncancel,
      },
    });

    await user.click(screen.getByLabelText("Close the modal"));

    expect(oncancel).toHaveBeenCalledTimes(1);
    expect(oncancel.mock.calls[0][0].detail).toEqual({
      trigger: "close-button",
    });
  });

  it("dispatches cancel with cancel-button trigger on the Cancel button", async () => {
    const oncancel = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        cancelText: "Cancel",
        oncancel,
      },
    });

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(oncancel).toHaveBeenCalledTimes(1);
    expect(oncancel.mock.calls[0][0].detail).toEqual({
      trigger: "cancel-button",
    });
    await tick();
    await tick();
    expect(isOpen()).toBe(false);
  });

  describe("confirmationPhrase", () => {
    it("disables confirm until the exact phrase is typed", async () => {
      render(ConfirmModalTest, {
        props: {
          open: true,
          title: "Delete this item?",
          confirmText: "Delete",
          confirmationPhrase: "delete",
        },
      });

      const confirmButton = screen.getByRole("button", { name: "Delete" });
      expect(confirmButton).toBeDisabled();

      const input = screen.getByLabelText("Type delete to confirm");
      await user.type(input, "delet");
      expect(confirmButton).toBeDisabled();

      await user.type(input, "e");
      expect(confirmButton).not.toBeDisabled();
    });

    it("accepts a pasted phrase with a trailing space or in another Unicode form", async () => {
      render(ConfirmModalTest, {
        props: {
          open: true,
          title: "Delete this café?",
          confirmText: "Delete",
          confirmationPhrase: "café",
        },
      });

      const input = screen.getByLabelText("Type café to confirm");
      // "e" followed by a combining acute accent, as some keyboards and
      // pasted text produce it.
      await fireEvent.input(input, { target: { value: "cafe\u0301 " } });

      expect(screen.getByRole("button", { name: "Delete" })).not.toBeDisabled();
    });
  });

  it("blocks Escape while loading and keeps the modal open", async () => {
    const oncancel = vi.fn();
    const onclose = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        loading: true,
        oncancel,
        onclose,
      },
    });

    // Escape only reaches the modal when focus is inside it.
    const container = screen.getByRole("alertdialog");
    container.focus();
    expect(container).toHaveFocus();

    await user.keyboard("{Escape}");
    await tick();

    expect(oncancel).not.toHaveBeenCalled();
    expect(onclose).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it("waits for a confirm promise, then closes without a cancel", async () => {
    let finish = () => {};
    const confirm = vi.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const oncancel = vi.fn();
    const onclose = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        confirmText: "Delete",
        confirm,
        oncancel,
        onclose,
      },
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    // Escape can't close the modal mid-request.
    const container = screen.getByRole("alertdialog");
    container.focus();
    expect(container).toHaveFocus();
    await user.keyboard("{Escape}");
    await tick();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(onclose).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);

    finish();
    await vi.waitFor(() => expect(onclose).toHaveBeenCalledTimes(1));

    expect(oncancel).not.toHaveBeenCalled();
    expect(onclose.mock.calls[0][0].detail).toEqual({
      trigger: "programmatic",
    });
  });

  it("stays open and reports the error when a confirm promise rejects", async () => {
    const error = new Error("Network down");
    const onconfirmerror = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        confirmText: "Delete",
        confirm: () => Promise.reject(error),
        onconfirmerror,
      },
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await tick();
    await tick();

    expect(onconfirmerror.mock.calls[0][0].detail).toEqual({ error });
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  it("ignores a confirm that settles after the modal was closed and reopened", async () => {
    let finish = () => {};
    const { rerender } = render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        confirmText: "Delete",
        confirm: () => new Promise<void>((resolve) => (finish = resolve)),
      },
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await rerender({ open: false });
    await rerender({ open: true });
    finish();
    await tick();
    await tick();

    expect(isOpen()).toBe(true);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("puts focus back on the confirm button when loading ends", async () => {
    const { rerender } = render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
        confirmText: "Delete",
        loading: true,
      },
    });
    (document.activeElement as HTMLElement | null)?.blur();

    await rerender({ loading: false });
    await tick();

    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
  });

  it.each([
    { kind: undefined, role: "alertdialog", danger: true, icon: false },
    {
      kind: "warning" as const,
      role: "alertdialog",
      danger: false,
      icon: true,
    },
    { kind: "info" as const, role: "dialog", danger: false, icon: false },
  ])(
    "kind $kind: role $role, danger button $danger, heading icon $icon",
    ({ kind, role, danger, icon }) => {
      const { container } = render(ConfirmModalTest, {
        props: { open: true, title: "Publish now?", confirmText: "Go", kind },
      });

      expect(screen.getByRole(role)).toBeInTheDocument();
      const confirmButton = screen.getByRole("button", { name: "Go" });
      expect(confirmButton.classList.contains("bx--btn--danger")).toBe(danger);
      expect(
        container.querySelector(".bx--confirm-modal__heading-icon") !== null,
      ).toBe(icon);
    },
  );

  it("uses the xs size by default", () => {
    render(ConfirmModalTest, {
      props: {
        open: true,
        title: "Delete this item?",
      },
    });

    expect(screen.getByRole("alertdialog")).toHaveClass(
      "bx--modal-container--xs",
    );
  });
});
