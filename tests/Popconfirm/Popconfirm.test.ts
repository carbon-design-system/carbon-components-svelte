import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import PopconfirmTest from "./Popconfirm.test.svelte";

const trigger = () => screen.getByRole("button", { name: "Remove" });
const dialog = () => screen.getByRole("alertdialog");

describe("Popconfirm", () => {
  it("wires the trigger as a button that opens a dialog", async () => {
    render(PopconfirmTest);

    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).not.toHaveAttribute("aria-controls");

    await user.click(trigger());

    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", dialog().id);
  });

  it("names the dialog by its title and describes it", async () => {
    render(PopconfirmTest, { props: { description: "You can't undo this." } });
    await user.click(trigger());

    expect(dialog()).toHaveAccessibleName("Delete this row?");
    expect(dialog()).toHaveAccessibleDescription("You can't undo this.");
    expect(dialog()).not.toHaveAttribute("aria-modal");
  });

  it("focuses Cancel for a danger confirmation and Confirm for info", async () => {
    const { unmount } = render(PopconfirmTest);
    await user.click(trigger());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );
    unmount();

    render(PopconfirmTest, { props: { kind: "info" } });
    await user.click(trigger());
    expect(screen.getByRole("dialog")).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus(),
    );
  });

  it("takes Escape for itself and returns focus to the trigger", async () => {
    const onkeydown = vi.fn();
    const oncancel = vi.fn();
    render(PopconfirmTest, { props: { onkeydown, oncancel } });
    await user.click(trigger());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );

    await user.keyboard("{Escape}");

    expect(oncancel.mock.calls[0][0].detail).toEqual({ trigger: "escape-key" });
    // A Modal around it never sees the key.
    expect(onkeydown).not.toHaveBeenCalledWith(
      expect.objectContaining({ key: "Escape" }),
    );
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it("cancels on an outside click without taking focus back", async () => {
    const oncancel = vi.fn();
    render(PopconfirmTest, { props: { oncancel } });
    await user.click(trigger());

    // The outside listener arms a task after opening.
    await waitFor(async () => {
      await user.click(screen.getByRole("button", { name: "Elsewhere" }));
      expect(oncancel).toHaveBeenCalled();
    });

    expect(oncancel.mock.calls[0][0].detail).toEqual({
      trigger: "outside-click",
    });
    expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
  });

  it("keeps Tab inside the popconfirm", async () => {
    render(PopconfirmTest);
    await user.click(trigger());
    const cancel = screen.getByRole("button", { name: "Cancel" });
    await waitFor(() => expect(cancel).toHaveFocus());

    await user.tab();
    expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
  });

  it("closes on a plain confirm", async () => {
    const onconfirm = vi.fn();
    const onclose = vi.fn();
    render(PopconfirmTest, { props: { onconfirm, onclose } });
    await user.click(trigger());
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onconfirm).toHaveBeenCalledTimes(1);
    expect(onclose).toHaveBeenCalledTimes(1);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  describe("async confirm", () => {
    it("holds the popconfirm open and loading until the work settles", async () => {
      let finish: () => void = () => {};
      const confirm = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      );
      render(PopconfirmTest, { props: { confirm } });
      await user.click(trigger());
      const confirmButton = screen.getByRole("button", { name: "Delete" });
      await user.click(confirmButton);

      expect(confirmButton).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
      // A second click and Escape are ignored while it runs.
      await user.click(confirmButton);
      await user.keyboard("{Escape}");
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(trigger()).toHaveAttribute("aria-expanded", "true");

      finish();
      await waitFor(() =>
        expect(trigger()).toHaveAttribute("aria-expanded", "false"),
      );
    });

    it("stays open on failure, shows the error and can retry", async () => {
      const onconfirmerror = vi.fn();
      const confirm = vi
        .fn()
        .mockRejectedValueOnce(new Error("nope"))
        .mockResolvedValueOnce(undefined);
      render(PopconfirmTest, {
        props: {
          confirm,
          onconfirmerror,
          errorText: (error: unknown) => `Failed: ${(error as Error).message}`,
        },
      });
      await user.click(trigger());
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Failed: nope",
      );
      expect(onconfirmerror.mock.calls[0][0].detail.error).toBeInstanceOf(
        Error,
      );
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
      expect(
        screen.getByRole("button", { name: "Delete" }),
      ).not.toHaveAttribute("aria-busy", "true");

      await user.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() =>
        expect(trigger()).toHaveAttribute("aria-expanded", "false"),
      );
      expect(confirm).toHaveBeenCalledTimes(2);
    });

    it("treats a synchronous throw as a failure", async () => {
      const confirm = vi.fn(() => {
        throw new Error("sync");
      });
      render(PopconfirmTest, { props: { confirm } });
      await user.click(trigger());
      await user.click(screen.getByRole("button", { name: "Delete" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Something went wrong. Try again.",
      );
      expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });
  });
});
