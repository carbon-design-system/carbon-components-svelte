import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { nextFrame } from "../utils/next-frame";
import { user } from "../utils/user";
import Toggletip from "./Toggletip.test.svelte";
import ToggletipInModal from "./ToggletipInModal.test.svelte";

/**
 * Listeners are enabled on the animation frame after opening, on top of the
 * `dismiss` action's own deferred registration. Wait for that frame before
 * flushing the `dismiss` action.
 */
const flush = async () => {
  await nextFrame();
  await flushDismiss();
};

describe("Toggletip", () => {
  it("should not close when the browser window loses focus (e.g. switching tabs)", async () => {
    const onClose = vi.fn();
    render(Toggletip, { props: { open: false, onClose } });

    const trigger = screen.getByRole("button", { name: "Information" });
    await user.click(trigger);
    await flush();

    window.dispatchEvent(new Event("blur"));
    await tick();
    await tick();

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should not close when clicking an interactive element inside the content", async () => {
    const onClose = vi.fn();
    render(Toggletip, {
      props: { open: false, onClose },
    });

    const trigger = screen.getByRole("button", { name: "Information" });
    await user.click(trigger);
    await flush();

    await user.click(screen.getByTestId("inside-button"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should close when focus leaves portalled content", async () => {
    const onClose = vi.fn();
    render(Toggletip, {
      props: { open: false, portalTooltip: true, onClose },
    });

    await user.click(screen.getByRole("button", { name: "Information" }));
    await flush();

    screen.getByTestId("inside-button").focus();
    await tick();
    expect(onClose).not.toHaveBeenCalled();

    screen.getByTestId("outside-button").focus();
    await tick();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should set aria-describedby on the trigger so content is announced the first time it opens", async () => {
    render(Toggletip, { props: { open: false } });

    const trigger = screen.getByRole("button", { name: "Information" });
    expect(trigger).not.toHaveAttribute("aria-describedby");

    await user.click(trigger);
    expect(trigger).toHaveAttribute(
      "aria-describedby",
      trigger.getAttribute("aria-controls") as string,
    );
  });

  it("should not close on an Escape that cancels an IME composition", async () => {
    const onClose = vi.fn();
    render(Toggletip, { props: { open: false, onClose } });

    const trigger = screen.getByRole("button", { name: "Information" });
    await user.click(trigger);

    await fireEvent.keyDown(trigger, {
      key: "Escape",
      isComposing: true,
      keyCode: 229,
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const onClose = vi.fn();
    render(Toggletip, { props: { open: false, onClose } });

    const trigger = screen.getByRole("button", { name: "Information" });
    await user.click(trigger);
    screen.getByTestId("inside-button").focus();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveFocus();
  });

  it("does not close an enclosing modal on Escape", async () => {
    const { container } = render(ToggletipInModal, {
      props: { portalTooltip: false },
    });

    const trigger = screen.getByRole("button", { name: "Information" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".bx--modal")).toHaveClass("is-visible");
  });

  it("closes when focus moves outside the toggletip", async () => {
    const onClose = vi.fn();
    render(Toggletip, { props: { open: false, onClose } });

    await user.click(screen.getByRole("button", { name: "Information" }));
    screen.getByTestId("inside-button").focus();
    screen.getByTestId("outside-button").focus();
    await tick();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open when focus leaves without a related target", async () => {
    const onClose = vi.fn();
    render(Toggletip, { props: { open: false, onClose } });

    await user.click(screen.getByRole("button", { name: "Information" }));
    await fireEvent.focusOut(screen.getByTestId("inside-button"), {
      relatedTarget: null,
    });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on a click outside", async () => {
    const onClose = vi.fn();
    render(Toggletip, { props: { open: false, onClose } });

    await user.click(screen.getByRole("button", { name: "Information" }));
    await flush();
    await user.click(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("inside a modal", () => {
    const content = () => document.getElementById("tt-content");
    const isPortalled = () =>
      !document.getElementById("tt")?.contains(content() ?? null);

    it.each([
      { portalTooltip: undefined, portalled: true },
      { portalTooltip: true, portalled: true },
      { portalTooltip: false, portalled: false },
    ])(
      "portals the content: $portalled when portalTooltip is $portalTooltip",
      async ({ portalTooltip, portalled }) => {
        render(ToggletipInModal, { props: { portalTooltip } });

        await user.click(screen.getByRole("button", { name: "Information" }));

        expect(content()).toBeInTheDocument();
        expect(isPortalled()).toBe(portalled);
      },
    );

    it("closes when the modal closes", async () => {
      const { rerender } = render(ToggletipInModal, {
        props: { toggletipOpen: true },
      });
      const trigger = screen.getByRole("button", { name: "Information" });
      expect(trigger).toHaveAttribute("aria-expanded", "true");

      await rerender({ modalOpen: false });
      await tick();

      expect(
        screen.getByRole("button", { name: "Information", hidden: true }),
      ).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("alignment", () => {
    const cases = [
      ["bottom", "start", "bottom-left", "marginLeft"],
      ["bottom", "center", "bottom", undefined],
      ["bottom", "end", "bottom-right", "marginRight"],
      ["top", "start", "top-left", "marginLeft"],
      ["top", "center", "top", undefined],
      ["top", "end", "top-right", "marginRight"],
      ["left", "start", "left-top", "marginTop"],
      ["left", "center", "left", undefined],
      ["left", "end", "left-bottom", "marginBottom"],
      ["right", "start", "right-top", "marginTop"],
      ["right", "center", "right", undefined],
      ["right", "end", "right-bottom", "marginBottom"],
    ] as const;

    it.each(cases)(
      "maps direction %s and align %s to %s",
      (direction, align, popoverAlign, margin) => {
        const { container } = render(Toggletip, {
          props: { direction, align },
        });

        const popover = container.querySelector<HTMLElement>(".bx--popover");
        expect(popover).toHaveClass(`bx--popover--${popoverAlign}`);
        for (const side of [
          "marginLeft",
          "marginRight",
          "marginTop",
          "marginBottom",
        ] as const) {
          expect(popover?.style[side]).toBe(side === margin ? "-4px" : "");
        }
      },
    );
  });

  describe("trigger", () => {
    it("omits aria-label when iconDescription is empty", () => {
      const { container } = render(Toggletip, {
        props: { iconDescription: "" },
      });

      expect(
        container.querySelector(".bx--toggletip-button"),
      ).not.toHaveAttribute("aria-label");
    });

    it("sets aria-expanded from the open state", async () => {
      render(Toggletip);

      const trigger = screen.getByRole("button", { name: "Information" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      await user.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("renders labelText beside the button", () => {
      render(Toggletip, { props: { labelText: "Details" } });

      expect(screen.getByText("Details")).toHaveClass("bx--toggletip-label");
    });
  });
});
