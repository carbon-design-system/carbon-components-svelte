import { render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { flushDismiss } from "../utils/flush-dismiss";
import { user } from "../utils/user";
import AnnotatedImage from "./AnnotatedImage.test.svelte";

const pinButtons = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>(".bx--annotated-image__pin"),
  );

describe("AnnotatedImage", () => {
  it("places each pin at its percentage and names it by number and label", () => {
    const { container } = render(AnnotatedImage);
    const [battery, , port] = pinButtons(container);

    const anchor = battery.parentElement as HTMLElement;
    expect(anchor.style.left).toBe("30%");
    expect(anchor.style.top).toBe("60%");
    expect(screen.getByRole("button", { name: "1 Battery" })).toBe(battery);
    // A `marker` replaces the number, and is still part of the name.
    expect(port).toHaveAccessibleName("C Port");
  });

  it("sizes the box from the image's natural size, or the crop's", () => {
    const { container, rerender } = render(AnnotatedImage);
    const box = () =>
      container.querySelector<HTMLElement>(".bx--aspect-ratio") as HTMLElement;
    expect(box().style.getPropertyValue("--ccs-aspect-ratio")).toBe("66.667%");
    expect(
      container.querySelector(".bx--annotated-image__frame--crop"),
    ).toBeNull();

    return rerender({ ratio: "1x1" }).then(() => {
      expect(box()).toHaveClass("bx--aspect-ratio--1x1");
      const frame = container.querySelector(
        ".bx--annotated-image__frame",
      ) as HTMLElement;
      expect(frame).toHaveClass("bx--annotated-image__frame--cover");
      expect(frame.style.getPropertyValue("--ccs-annotated-image-aspect")).toBe(
        "1.5",
      );
    });
  });

  it("opens one popover at a time, and Escape closes it and focuses the pin", async () => {
    const { container, component } = render(AnnotatedImage);
    const [battery, camera] = pinButtons(container);

    await user.click(battery);
    expect(battery).toHaveAttribute("aria-expanded", "true");
    expect(battery).toHaveAttribute("aria-controls");
    expect(screen.getByText("Lasts ten hours.")).toBeVisible();
    expect(component.openId).toBe("a");

    await user.click(camera);
    expect(battery).toHaveAttribute("aria-expanded", "false");
    expect(component.openId).toBe("b");

    camera.blur();
    await flushDismiss();
    await user.keyboard("{Escape}");
    expect(component.openId).toBeNull();

    battery.focus();
    await user.keyboard("{Enter}");
    expect(battery).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(battery).toHaveAttribute("aria-expanded", "false");
    expect(battery).toHaveFocus();
  });

  it("closes on an outside click", async () => {
    const { container, component } = render(AnnotatedImage);
    await user.click(pinButtons(container)[0]);
    await flushDismiss();
    await user.click(document.body);
    expect(component.openId).toBeNull();
  });

  it("a legend item opens the pin's popover and focuses the pin", async () => {
    const { container } = render(AnnotatedImage, { legend: "end" });
    const items = container.querySelectorAll<HTMLButtonElement>(
      ".bx--annotated-image__legend-item",
    );
    expect(items).toHaveLength(3);
    await user.click(items[1]);
    const camera = pinButtons(container)[1];
    expect(camera).toHaveAttribute("aria-expanded", "true");
    expect(camera).toHaveFocus();
  });

  it("makes every pin a tab stop, or one with keyboard=roving", async () => {
    const tab = render(AnnotatedImage);
    expect(
      pinButtons(tab.container).map((pin) => pin.getAttribute("tabindex")),
    ).toEqual([null, null, null]);
    tab.unmount();

    const { container } = render(AnnotatedImage, { keyboard: "roving" });
    const pins = pinButtons(container);
    expect(pins.map((pin) => pin.getAttribute("tabindex"))).toEqual([
      "0",
      "-1",
      "-1",
    ]);
    pins[0].focus();
    await user.keyboard("{ArrowRight}");
    expect(pins[1]).toHaveFocus();
    expect(pins.map((pin) => pin.getAttribute("tabindex"))).toEqual([
      "-1",
      "0",
      "-1",
    ]);
    await user.keyboard("{End}");
    expect(pins[2]).toHaveFocus();
  });

  describe("editable", () => {
    it("adds a pin from the button, and moves and removes one from the keyboard", async () => {
      const { container, component } = render(AnnotatedImage, {
        editable: true,
      });
      await user.click(screen.getByRole("button", { name: "Add pin" }));
      expect(component.pins!).toHaveLength(4);
      expect(component.pins![3]).toMatchObject({ x: 50, y: 50 });
      await tick();
      const added = pinButtons(container)[3];
      expect(added).toHaveFocus();

      await user.keyboard("{ArrowRight}{Shift>}{ArrowDown}{/Shift}");
      expect(component.pins![3]).toMatchObject({ x: 51, y: 60 });

      await user.keyboard("{Delete}");
      expect(component.pins!).toHaveLength(3);
      expect(component.changes).toEqual([
        expect.stringMatching(/^add:/),
        expect.stringMatching(/^move:/),
        expect.stringMatching(/^move:/),
        expect.stringMatching(/^remove:/),
      ]);
      // Focus moves to a neighbor instead of falling to the page.
      expect(pinButtons(container)[2]).toHaveFocus();
    });

    it("leaves the arrow keys alone when it is not editable", async () => {
      const { container, component } = render(AnnotatedImage);
      pinButtons(container)[0].focus();
      await user.keyboard("{ArrowRight}{Delete}");
      expect(component.pins!).toHaveLength(3);
      expect(component.pins![0].x).toBe(30);
    });
  });
});
