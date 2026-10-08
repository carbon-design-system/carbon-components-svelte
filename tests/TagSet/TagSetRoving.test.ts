import { render, screen, waitFor, within } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import TagSetRoving from "./TagSetRoving.test.svelte";

function closeButtonOf(label: string) {
  const tag = screen.getByText(label).closest(".bx--tag") as HTMLElement;
  return within(tag).getByTitle("Clear filter");
}

/** Wait for the set's post-mount measure to pick a tab stop. */
async function renderRoving(props: Record<string, unknown> = {}) {
  const result = render(TagSetRoving, { props });
  await waitFor(() => {
    expect(closeButtonOf("Tag 1")).toHaveAttribute("tabindex", "0");
  });
  return result;
}

describe("TagSet navigation=roving", () => {
  it("makes the set a single tab stop, skipping read-only tags", async () => {
    await renderRoving();

    expect(closeButtonOf("Tag 2")).toHaveAttribute("tabindex", "-1");
    expect(closeButtonOf("Tag 3")).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("button", { name: "Interactive" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
    expect(screen.getByRole("button", { name: "Selectable" })).toHaveAttribute(
      "tabindex",
      "-1",
    );

    screen.getByRole("button", { name: "Before" }).focus();
    await user.tab();
    expect(closeButtonOf("Tag 1")).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  });

  it("moves focus and the tab stop with arrow keys, Home, and End", async () => {
    await renderRoving();

    closeButtonOf("Tag 1").focus();
    await user.keyboard("{ArrowRight}");
    expect(closeButtonOf("Tag 2")).toHaveFocus();
    expect(closeButtonOf("Tag 2")).toHaveAttribute("tabindex", "0");
    expect(closeButtonOf("Tag 1")).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{End}");
    expect(screen.getByRole("button", { name: "Selectable" })).toHaveFocus();

    // Doesn't wrap past the ends.
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Selectable" })).toHaveFocus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Interactive" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(closeButtonOf("Tag 1")).toHaveFocus();
  });

  it("closes a focused dismissible tag with Delete or Backspace", async () => {
    const onTagClose = vi.fn();
    const onClose = vi.fn();
    await renderRoving({ onTagClose, onClose });

    closeButtonOf("Tag 2").focus();
    await user.keyboard("{Delete}");
    await tick();

    expect(onClose).toHaveBeenCalledExactlyOnceWith("Tag 2");
    expect(onTagClose).toHaveBeenCalledExactlyOnceWith(
      // The read-only tag counts toward the index.
      expect.objectContaining({ index: 2 }),
    );
    expect(screen.queryByText("Tag 2")).not.toBeInTheDocument();
    // Focus and the tab stop land on the next tag.
    expect(closeButtonOf("Tag 3")).toHaveFocus();
    expect(closeButtonOf("Tag 3")).toHaveAttribute("tabindex", "0");

    await user.keyboard("{Backspace}");
    await tick();
    expect(onClose).toHaveBeenLastCalledWith("Tag 3");
    expect(screen.queryByText("Tag 3")).not.toBeInTheDocument();
  });

  it("announces the delete shortcut on close buttons", async () => {
    await renderRoving();

    expect(closeButtonOf("Tag 1")).toHaveAttribute(
      "aria-keyshortcuts",
      "Delete Backspace",
    );
  });

  it("leaves the native tab order alone by default", async () => {
    const onClose = vi.fn();
    render(TagSetRoving, { props: { navigation: "tab", onClose } });
    await tick();

    expect(closeButtonOf("Tag 1")).not.toHaveAttribute("tabindex");
    expect(closeButtonOf("Tag 2")).not.toHaveAttribute("tabindex");
    expect(closeButtonOf("Tag 1")).not.toHaveAttribute("aria-keyshortcuts");

    closeButtonOf("Tag 1").focus();
    await user.keyboard("{ArrowRight}");
    expect(closeButtonOf("Tag 1")).toHaveFocus();

    await user.keyboard("{Delete}");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("includes the +N indicator and skips tags hidden in the overflow", async () => {
    // Visible: Read only, Tag 1, Tag 2.
    await renderRoving({ maxVisible: 3 });
    const trigger = screen.getByRole("button", { name: "+3 more tags" });

    closeButtonOf("Tag 1").focus();
    await user.keyboard("{End}");
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("tabindex", "0");
    expect(closeButtonOf("Tag 1")).toHaveAttribute("tabindex", "-1");

    await user.keyboard("{ArrowLeft}");
    expect(closeButtonOf("Tag 2")).toHaveFocus();
  });

  it("moves the tab stop off a tag once it overflows", async () => {
    await renderRoving();

    await user.click(screen.getByRole("button", { name: "Selectable" }));
    expect(screen.getByRole("button", { name: "Selectable" })).toHaveAttribute(
      "tabindex",
      "0",
    );

    await user.click(screen.getByRole("button", { name: "Collapse" }));
    await waitFor(() => {
      expect(closeButtonOf("Tag 1")).toHaveAttribute("tabindex", "0");
    });
  });
});
