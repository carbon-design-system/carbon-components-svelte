import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { nextFrame } from "../utils/next-frame";
import { user } from "../utils/user";
import OperationalTag from "./OperationalTag.test.svelte";

const trigger = () => screen.getByRole("button", { name: "3 policies" });
const popover = (container: HTMLElement) =>
  container.querySelector(".bx--popover") as HTMLElement;

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

  describe("align", () => {
    afterEach(() => {
      document.documentElement.removeAttribute("style");
    });

    it.each([
      ["bottom", "start", "bottom-left"],
      ["bottom", "center", "bottom"],
      ["top", "end", "top-right"],
    ] as const)(
      "maps direction %s and align %s to %s",
      (direction, align, placement) => {
        const { container } = render(OperationalTag, {
          open: true,
          direction,
          align,
        });
        expect(popover(container)).toHaveClass(`bx--popover--${placement}`);
      },
    );

    // `start` and `end` name inline sides, as in Toggletip.
    it.each([
      ["bottom", "start", "bottom-right"],
      ["top", "end", "top-left"],
    ] as const)(
      "maps direction %s and align %s to %s in RTL",
      (direction, align, placement) => {
        document.documentElement.style.direction = "rtl";
        const { container } = render(OperationalTag, {
          open: true,
          direction,
          align,
        });
        expect(popover(container)).toHaveClass(`bx--popover--${placement}`);
      },
    );
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

  it("can't open while disabled", async () => {
    const onOpen = vi.fn();
    const { container } = render(OperationalTag, {
      open: true,
      disabled: true,
      onOpen,
    });

    expect(trigger()).toBeDisabled();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(popover(container)).not.toHaveClass("bx--popover--open");

    await user.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("is a plain action button without content", async () => {
    const onClick = vi.fn();
    const { container } = render(OperationalTag, { action: true, onClick });
    const tag = screen.getByRole("button", { name: "Run scan" });

    expect(tag).not.toHaveAttribute("aria-expanded");
    expect(tag).not.toHaveAttribute("aria-controls");

    await user.click(tag);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".bx--popover")).toBeNull();
  });

  it.each([
    [true, true],
    [false, false],
  ])(
    "with an icon (%s), marks the tag for the tighter leading padding",
    (withIcon, marked) => {
      render(OperationalTag, { action: true, withIcon });

      expect(
        screen
          .getByRole("button", { name: "Run scan" })
          .classList.contains("bx--tag--with-icon"),
      ).toBe(marked);
    },
  );

  it("takes its size from a parent TagSet", () => {
    render(OperationalTag, { inSet: true });

    expect(screen.getByRole("button", { name: "In a set" })).toHaveClass(
      "bx--tag--sm",
    );
  });
});
