import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import ConfirmModalTest from "./ConfirmModal.test.svelte";

describe("ConfirmModal", () => {
  it("renders the heading and both buttons", () => {
    render(ConfirmModalTest, {
      props: {
        open: true,
        heading: "Delete this item?",
        confirmText: "Delete",
        cancelText: "Cancel",
      },
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Delete this item?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("dispatches confirm and closes on confirm click", async () => {
    const onconfirm = vi.fn();
    const oncancel = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        heading: "Delete this item?",
        confirmText: "Delete",
        onconfirm,
        oncancel,
      },
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onconfirm).toHaveBeenCalledTimes(1);
    await tick();
    await tick();
    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");
    expect(oncancel).not.toHaveBeenCalled();
  });

  it("keeps the modal open after confirm when closeOnConfirm is false", async () => {
    const onconfirm = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        heading: "Delete this item?",
        confirmText: "Delete",
        closeOnConfirm: false,
        onconfirm,
      },
    });

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onconfirm).toHaveBeenCalledTimes(1);
    await tick();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dispatches cancel with close-button trigger on the X", async () => {
    const oncancel = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        heading: "Delete this item?",
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
        heading: "Delete this item?",
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
    expect(document.querySelector(".bx--modal")).not.toHaveClass("is-visible");
  });

  describe("confirmationPhrase", () => {
    it("disables confirm until the exact phrase is typed", async () => {
      render(ConfirmModalTest, {
        props: {
          open: true,
          heading: "Delete this item?",
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
  });

  it("blocks Escape while loading and keeps the modal open", async () => {
    const oncancel = vi.fn();
    render(ConfirmModalTest, {
      props: {
        open: true,
        heading: "Delete this item?",
        loading: true,
        oncancel,
      },
    });

    await user.keyboard("{Escape}");
    await tick();

    expect(oncancel).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("renders the warning icon for kind warning", () => {
    const { container } = render(ConfirmModalTest, {
      props: {
        open: true,
        heading: "Unsaved changes",
        kind: "warning",
      },
    });

    expect(
      container.querySelector(".bx--confirm-modal__heading-icon"),
    ).toBeInTheDocument();
  });

  it("uses the xs size by default", () => {
    render(ConfirmModalTest, {
      props: {
        open: true,
        heading: "Delete this item?",
      },
    });

    expect(screen.getByRole("dialog")).toHaveClass("bx--modal-container--xs");
  });
});
