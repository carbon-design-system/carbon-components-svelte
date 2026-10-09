import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import OperationalTag from "./OperationalTag.test.svelte";

const trigger = () => screen.getByRole("button", { name: "3 policies" });
const popover = (container: HTMLElement) =>
  container.querySelector(".bx--popover") as HTMLElement;

/** Window listeners attach on the frame after opening. */
const nextFrame = () =>
  new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

describe("OperationalTag", () => {
  it("toggles its popover from the whole tag", async () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    const { container } = render(OperationalTag, { onOpen, onClose });

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("aria-controls", "policies-content");
    expect(popover(container)).not.toHaveClass("bx--popover--open");

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(popover(container)).toHaveClass("bx--popover--open");
    expect(popover(container)).toHaveAttribute("id", "policies-content");
    expect(onOpen).toHaveBeenCalledTimes(1);

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and returns focus to the tag", async () => {
    render(OperationalTag, { open: true });

    screen.getByRole("link", { name: "Retention" }).focus();
    await user.keyboard("{Escape}");

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
  });

  it("closes on an outside click", async () => {
    render(OperationalTag);

    await user.click(trigger());
    await nextFrame();
    await user.click(screen.getByRole("button", { name: "Outside" }));
    await tick();

    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("can't open while disabled", () => {
    render(OperationalTag, { disabled: true });

    expect(trigger()).toBeDisabled();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("takes its size from a parent TagSet", () => {
    render(OperationalTag, { inSet: true });

    expect(screen.getByRole("button", { name: "In a set" })).toHaveClass(
      "bx--tag--sm",
    );
  });
});
