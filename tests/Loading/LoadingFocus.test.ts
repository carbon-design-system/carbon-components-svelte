import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import LoadingFocus from "./LoadingFocus.test.svelte";

async function settle() {
  await tick();
  await tick();
}

function getOverlay() {
  return screen.getByRole("dialog", { name: "Saving changes" });
}

async function startLoading() {
  const view = render(LoadingFocus);
  screen.getByRole("button", { name: "Save" }).focus();
  await view.rerender({ active: true });
  await settle();
  return view;
}

describe("Loading focus", () => {
  it("names the overlay as a dialog only while active", async () => {
    const { rerender } = render(LoadingFocus, { active: true });
    const overlay = getOverlay();

    expect(overlay).toHaveClass("bx--loading-overlay");
    expect(overlay).toHaveAttribute("tabindex", "-1");
    expect(overlay).not.toHaveAttribute("aria-modal");

    await rerender({ active: false });
    expect(overlay).not.toHaveAttribute("role");
    expect(overlay).not.toHaveAttribute("aria-label");
  });

  it("names the spinner once, from its title", () => {
    render(LoadingFocus, { active: true });
    const svg = screen.getByRole("img", { name: "Saving changes" });

    expect(svg).not.toHaveAttribute("aria-label");
    expect(svg.querySelector("title")).toHaveTextContent("Saving changes");
  });

  it("moves focus into the overlay when loading starts", async () => {
    await startLoading();
    expect(getOverlay()).toHaveFocus();
  });

  it.each([
    ["Tab", "{Tab}"],
    ["Shift+Tab", "{Shift>}{Tab}{/Shift}"],
  ])("keeps focus in the overlay on %s", async (_, keys) => {
    await startLoading();
    await user.keyboard(keys);
    expect(getOverlay()).toHaveFocus();
  });

  it("reclaims focus that moves behind the overlay", async () => {
    await startLoading();
    screen.getByRole("button", { name: "Cancel" }).focus();
    expect(getOverlay()).toHaveFocus();
  });

  it("restores focus when loading stops", async () => {
    const { rerender } = await startLoading();
    expect(getOverlay()).toHaveFocus();

    await rerender({ active: false });
    await settle();
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  });

  it("restores focus when the overlay unmounts while active", async () => {
    const { rerender } = await startLoading();
    expect(getOverlay()).toHaveFocus();

    await rerender({ withOverlay: false });
    await settle();
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus();
  });

  it("defers to a modal opened on top", async () => {
    const { rerender } = await startLoading();
    await rerender({ modalOpen: true });
    await settle();

    const close = screen.getByRole("button", { name: "Close" });
    expect(close).toHaveFocus();

    await user.tab();
    expect(close).toHaveFocus();

    await rerender({ modalOpen: false });
    await settle();
    expect(getOverlay()).toHaveFocus();
  });

  it("leaves focus alone without the overlay", async () => {
    render(LoadingFocus, { active: true, withOverlay: false });
    await settle();
    const save = screen.getByRole("button", { name: "Save" });

    const dialog = screen.queryByRole("dialog", { name: "Saving changes" });
    expect(dialog).toBeNull();
    expect(document.querySelector(".bx--loading")).not.toHaveAttribute(
      "tabindex",
    );

    save.focus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });
});
