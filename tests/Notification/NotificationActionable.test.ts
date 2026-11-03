import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import NotificationActionable from "./NotificationActionable.test.svelte";

const TITLE = "Record deleted";
const SUBTITLE = "The record moved to the trash.";

async function openFromTrigger() {
  const trigger = screen.getByRole("button", { name: "Delete" });
  await user.click(trigger);
  await tick();
  return trigger;
}

describe.each(["inline", "toast"] as const)("actionable (%s)", (type) => {
  it("is an alertdialog named by the title and described by the subtitle", () => {
    render(NotificationActionable, { props: { type, open: true } });

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAccessibleName(TITLE);
    expect(dialog).toHaveAccessibleDescription(SUBTITLE);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("is named by the subtitle when there is no title", () => {
    render(NotificationActionable, {
      props: { type, open: true, title: "" },
    });

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveAccessibleName(SUBTITLE);
    expect(dialog).not.toHaveAttribute("aria-describedby");
  });

  it("moves focus to the action when it opens", async () => {
    render(NotificationActionable, { props: { type } });

    await openFromTrigger();

    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
  });

  it("moves focus to the action when it mounts open", async () => {
    render(NotificationActionable, { props: { type, open: true } });
    await tick();

    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
  });

  it("falls back to the close button, then to itself", async () => {
    const { rerender } = render(NotificationActionable, {
      props: { type, withAction: false },
    });

    await openFromTrigger();
    expect(
      screen.getByRole("button", { name: "Close notification" }),
    ).toHaveFocus();

    await rerender({ open: false, hideCloseButton: true });
    await openFromTrigger();
    expect(screen.getByRole("alertdialog")).toHaveFocus();
  });

  it("keeps focus in place with focusOnOpen false", async () => {
    render(NotificationActionable, { props: { type, focusOnOpen: false } });

    const trigger = await openFromTrigger();

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on Escape through the close event and returns focus", async () => {
    const onClose = vi.fn();
    const onKeydown = vi.fn();
    render(NotificationActionable, { props: { type, onClose, onKeydown } });

    const trigger = await openFromTrigger();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0].detail).toEqual({ timeout: false });
    expect(trigger).toHaveFocus();
    // A surrounding modal must not also close on the same key.
    expect(onKeydown.mock.calls.some(([event]) => event.key === "Escape")).toBe(
      false,
    );
  });

  it("stays open on Escape when the close event is prevented", async () => {
    render(NotificationActionable, {
      props: { type, onClose: (event) => event.preventDefault() },
    });

    await openFromTrigger();
    await user.keyboard("{Escape}");

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("stays open on Escape with closeOnEscape false", async () => {
    const onClose = vi.fn();
    render(NotificationActionable, {
      props: { type, closeOnEscape: false, onClose },
    });

    await openFromTrigger();
    await user.keyboard("{Escape}");

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it.each([
    ["while composing", { isComposing: true }],
    ["after Safari ends the composition", { keyCode: 229 }],
  ])("stays open on an IME Escape %s", async (_, init) => {
    const onClose = vi.fn();
    render(NotificationActionable, { props: { type, onClose } });

    await openFromTrigger();
    await fireEvent.keyDown(screen.getByRole("button", { name: "Undo" }), {
      key: "Escape",
      ...init,
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("returns focus when the close button closes it", async () => {
    render(NotificationActionable, { props: { type } });

    const trigger = await openFromTrigger();
    await user.click(
      screen.getByRole("button", { name: "Close notification" }),
    );

    expect(trigger).toHaveFocus();
  });

  it("returns focus to its trigger, not a notification beside it", async () => {
    const { container } = render(NotificationActionable, { props: { type } });
    render(NotificationActionable, {
      props: { type, open: true, focusOnOpen: false },
    });

    const trigger = within(container).getByRole("button", { name: "Delete" });
    await user.click(trigger);
    await tick();
    await user.click(
      within(container).getByRole("button", { name: "Close notification" }),
    );

    expect(screen.getAllByRole("alertdialog")).toHaveLength(1);
    expect(trigger).toHaveFocus();
  });

  it("skips focus return when the trigger left the document", async () => {
    render(NotificationActionable, { props: { type } });

    const trigger = await openFromTrigger();
    trigger.remove();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(document.body).toHaveFocus();
  });

  it("wraps Tab inside the notification", async () => {
    render(NotificationActionable, { props: { type } });

    await openFromTrigger();
    const undo = screen.getByRole("button", { name: "Undo" });
    const close = screen.getByRole("button", { name: "Close notification" });

    await user.tab();
    expect(close).toHaveFocus();
    await user.tab();
    expect(undo).toHaveFocus();
    await user.tab({ shift: true });
    expect(close).toHaveFocus();
  });

  it("wraps Tab while Escape can close it", async () => {
    render(NotificationActionable, { props: { type, hideCloseButton: true } });

    await openFromTrigger();
    const undo = screen.getByRole("button", { name: "Undo" });

    await user.tab();
    expect(undo).toHaveFocus();
  });

  it("wraps Tab while the close button can close it", async () => {
    render(NotificationActionable, { props: { type, closeOnEscape: false } });

    await openFromTrigger();
    await user.tab();
    await user.tab();

    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();
  });

  it("lets Tab leave when the keyboard cannot close it", async () => {
    render(NotificationActionable, {
      props: { type, hideCloseButton: true, closeOnEscape: false },
    });

    await openFromTrigger();
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("describes the action by the title when not actionable", () => {
    render(NotificationActionable, {
      props: { type, actionable: false, open: true },
    });

    expect(
      screen.getByRole("button", { name: "Undo" }),
    ).toHaveAccessibleDescription(TITLE);
  });

  it("does not describe the action without a title", () => {
    render(NotificationActionable, {
      props: { type, actionable: false, open: true, title: "" },
    });

    expect(screen.getByRole("button", { name: "Undo" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("does not repeat the dialog name on the action when actionable", () => {
    render(NotificationActionable, { props: { type, open: true } });

    expect(screen.getByRole("button", { name: "Undo" })).not.toHaveAttribute(
      "aria-describedby",
    );
  });

  it("keeps today's role, labels, focus, and keys when not actionable", async () => {
    const onClose = vi.fn();
    render(NotificationActionable, {
      props: { type, actionable: false, onClose },
    });

    const trigger = await openFromTrigger();
    // Accept either live region role, so this holds whether the default
    // is `alert` or `status`.
    const region = screen.getByText(TITLE).closest("[role]");

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(region?.getAttribute("role")).toMatch(/^(alert|status)$/);
    expect(region).not.toHaveAttribute("tabindex");
    expect(region).not.toHaveAttribute("aria-labelledby");
    expect(region).not.toHaveAttribute("aria-describedby");
    // The only id is the title's, which describes the action.
    expect(
      Array.from(region?.querySelectorAll("[id]") ?? [], (node) => node.id),
    ).toEqual([screen.getByText(TITLE).closest("[id]")?.id]);
    expect(trigger).toHaveFocus();

    screen.getByRole("button", { name: "Undo" }).focus();
    await user.keyboard("{Escape}");
    expect(region).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    await user.tab();
    expect(
      screen.getByRole("button", { name: "Close notification" }),
    ).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });
});
