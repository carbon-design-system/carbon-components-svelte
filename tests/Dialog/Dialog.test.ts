import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import Dialog from "./Dialog.test.svelte";

interface CloseContext {
  dialogEl: HTMLDialogElement;
  rerender: (props: object) => Promise<void>;
  onclose: () => void;
}

describe("Dialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [true, "showModal"],
    [false, "show"],
  ] as const)(
    "modal=%s calls %s() and dispatches open once when open becomes true",
    async (modal, method) => {
      const spy = vi.spyOn(HTMLDialogElement.prototype, method);
      const onopen = vi.fn();

      const { rerender } = render(Dialog, { props: { modal, onopen } });
      await rerender({ modal, open: true, onopen });
      await tick();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(onopen).toHaveBeenCalledTimes(1);
      expect(screen.getByRole("dialog")).toHaveAttribute("open");
    },
  );

  it("shows the dialog once and dispatches open once when mounted open", () => {
    const showSpy = vi.spyOn(HTMLDialogElement.prototype, "show");
    const onopen = vi.fn();

    render(Dialog, { props: { open: true, onopen } });

    expect(showSpy).toHaveBeenCalledTimes(1);
    expect(onopen).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it.each([
    [
      "programmatic",
      false,
      async ({ rerender, onclose }: CloseContext) => {
        await rerender({ open: false, onclose });
      },
    ],
    [
      "backdrop",
      true,
      async ({ dialogEl }: CloseContext) => {
        await user.click(dialogEl);
      },
    ],
    [
      "close-button",
      true,
      async () => {
        await user.click(screen.getByTestId("close-button"));
      },
    ],
    [
      "escape-key",
      true,
      // dom-env turns no key press into `cancel`, so dispatch it by hand.
      ({ dialogEl }: CloseContext) => {
        dialogEl.dispatchEvent(new Event("cancel"));
        dialogEl.close();
      },
    ],
  ])('dispatches close with trigger "%s"', async (trigger, modal, act) => {
    const onclose = vi.fn();
    const { rerender } = render(Dialog, {
      props: { open: true, modal, onclose },
    });

    const dialogEl = screen.getByRole("dialog");
    assert(dialogEl instanceof HTMLDialogElement);
    await act({ dialogEl, rerender, onclose });
    await tick();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({ trigger });
    expect(dialogEl).not.toHaveAttribute("open");
  });

  it.each([false, true])(
    "stays open across an unrelated prop update (modal: %s)",
    async (modal) => {
      const { rerender } = render(Dialog, { props: { modal } });
      await rerender({ modal, open: true });
      expect(screen.getByRole("dialog")).toHaveAttribute("open");

      await rerender({ modal, open: true, preventCloseOnClickOutside: true });

      expect(screen.getByRole("dialog")).toHaveAttribute("open");
    },
  );

  it('dispatches close once with trigger "programmatic" for a modal opened after mount', async () => {
    const onclose = vi.fn();
    const { rerender } = render(Dialog, { props: { modal: true, onclose } });
    await rerender({ modal: true, open: true, onclose });

    await rerender({ modal: true, open: false, onclose });
    await tick();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({
      trigger: "programmatic",
    });
  });

  it.each([
    [
      "a press that started inside the content and is released on the backdrop",
      async (dialogEl: HTMLElement) => {
        await user.pointer([
          { keys: "[MouseLeft>]", target: screen.getByText("Dialog content") },
          { keys: "[/MouseLeft]", target: dialogEl },
        ]);
      },
    ],
    [
      "a click on the dialog's own padding",
      async (dialogEl: HTMLElement) => {
        dialogEl.getBoundingClientRect = () =>
          rect({ top: 100, left: 100, width: 400, height: 300 });
        const point = { clientX: 105, clientY: 105 };
        await fireEvent.mouseDown(dialogEl, point);
        await fireEvent.mouseUp(dialogEl, point);
        await fireEvent.click(dialogEl, point);
      },
    ],
  ])("does not close on %s", async (_, act) => {
    const onclose = vi.fn();
    render(Dialog, { props: { open: true, modal: true, onclose } });

    const dialogEl = screen.getByRole("dialog");
    await act(dialogEl);

    expect(onclose).not.toHaveBeenCalled();
    expect(dialogEl).toHaveAttribute("open");
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

  it("restores focus to the opener when the dialog closes", async () => {
    render(Dialog, { props: { modal: true } });

    const opener = screen.getByTestId("opener");
    await user.click(opener);
    await tick();

    expect(screen.getByRole("dialog")).toHaveAttribute("open");

    // Focus is inside the dialog when it closes, so only the restore puts it
    // back on the opener.
    const closeButton = screen.getByTestId("close-button");
    closeButton.focus();
    expect(closeButton).toHaveFocus();

    await user.click(closeButton);
    await tick();

    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute(
      "open",
    );
    expect(opener).toHaveFocus();
  });

  it("syncs open to false when the browser closes the dialog, so it can open again", async () => {
    const onopen = vi.fn();
    const onclose = vi.fn();
    render(Dialog, { props: { open: true, modal: true, onopen, onclose } });

    const dialogEl = screen.getByRole("dialog");
    assert(dialogEl instanceof HTMLDialogElement);
    dialogEl.close();
    await tick();

    expect(onclose).toHaveBeenCalledTimes(1);
    expect(onclose.mock.calls[0][0].detail).toEqual({
      trigger: "close-button",
    });
    expect(dialogEl).not.toHaveAttribute("open");

    await user.click(screen.getByTestId("opener"));
    await tick();

    expect(onopen).toHaveBeenCalledTimes(2);
    expect(dialogEl).toHaveAttribute("open");
  });
});
