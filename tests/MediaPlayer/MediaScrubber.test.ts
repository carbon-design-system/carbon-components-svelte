import { fireEvent, render, screen } from "@testing-library/svelte";
import { rect } from "../utils/rect";
import { user } from "../utils/user";
import MediaScrubber from "./MediaScrubber.test.svelte";

const TRACK = { left: 0, right: 200, width: 200, top: 0, bottom: 4, height: 4 };

function setup(props: Record<string, unknown> = {}) {
  const handlers = {
    onscrubstart: vi.fn(),
    oninput: vi.fn(),
    onchange: vi.fn(),
  };
  const result = render(MediaScrubber, { props: { ...handlers, ...props } });
  const track = result.container.querySelector(".bx--media-scrubber__track");
  assert(track instanceof HTMLElement);
  vi.spyOn(track, "getBoundingClientRect").mockReturnValue(rect(TRACK));
  const root = result.container.querySelector(".bx--media-scrubber");
  assert(root instanceof HTMLElement);
  return { ...result, ...handlers, root, thumb: screen.getByRole("slider") };
}

describe("MediaScrubber", () => {
  it("names the position in words, of the length", () => {
    const { thumb } = setup();

    expect(thumb).toHaveAccessibleName("Seek");
    expect(thumb).toHaveAttribute("aria-valuemin", "0");
    expect(thumb).toHaveAttribute("aria-valuemax", "240");
    expect(thumb).toHaveAttribute("aria-valuenow", "65");
    expect(thumb).toHaveAttribute(
      "aria-valuetext",
      "1 minute 5 seconds of 4 minutes",
    );
  });

  it("adds the chapter's title to the spoken position", () => {
    const { thumb } = setup({
      chapters: [
        { start: 0, end: 60, title: "Intro" },
        { start: 60, end: 240, title: "Setup" },
      ],
    });

    expect(thumb).toHaveAttribute(
      "aria-valuetext",
      "1 minute 5 seconds of 4 minutes, Setup",
    );
  });

  it("draws each buffered range and each chapter start after the first", () => {
    const { container } = setup({
      buffered: [[0, 60]],
      chapters: [
        { start: 0, end: 60, title: "Intro" },
        { start: 60, end: 240, title: "Setup" },
      ],
    });

    const buffered = container.querySelector<HTMLElement>(
      ".bx--media-scrubber__buffered",
    );
    expect(buffered?.style.left).toBe("0%");
    expect(buffered?.style.width).toBe("25%");
    const marks = container.querySelectorAll<HTMLElement>(
      ".bx--media-scrubber__chapter",
    );
    expect(marks).toHaveLength(1);
    expect(marks[0].style.left).toBe("25%");
  });

  it.each([
    ["{ArrowRight}", 70],
    ["{ArrowLeft}", 60],
    ["{PageUp}", 89],
    ["{PageDown}", 41],
    ["{Home}", 0],
    ["{End}", 240],
  ])("moves to the time %s asks for", async (keys, time) => {
    const { thumb, oninput, onchange } = setup();
    thumb.focus();

    await user.keyboard(keys);

    expect(oninput).toHaveBeenCalledWith({ time });
    expect(onchange).toHaveBeenCalledWith({ time });
  });

  it("does not swap the arrow keys in a right-to-left page", async () => {
    document.documentElement.dir = "rtl";
    try {
      const { thumb, onchange } = setup();
      thumb.focus();

      await user.keyboard("{ArrowRight}");

      expect(onchange).toHaveBeenCalledWith({ time: 70 });
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });

  it("leaves browser key combinations alone", async () => {
    const { thumb, onchange } = setup();
    thumb.focus();

    await user.keyboard("{Alt>}{ArrowLeft}{/Alt}");

    expect(onchange).not.toHaveBeenCalled();
  });

  it("is disabled, and out of the tab order, until the length is known", async () => {
    const { thumb, onchange } = setup({ duration: 0, currentTime: 0 });

    expect(thumb).toHaveAttribute("aria-disabled", "true");
    expect(thumb).not.toHaveAttribute("tabindex");
    await fireEvent.keyDown(thumb, { key: "ArrowRight" });
    expect(onchange).not.toHaveBeenCalled();
  });

  it("follows the pointer, and ignores the clock, until it is released", async () => {
    const { root, thumb, rerender, onscrubstart, oninput, onchange } = setup();

    await fireEvent.pointerDown(root, { clientX: 50, pointerId: 1 });
    expect(onscrubstart).toHaveBeenCalledWith({ time: 60 });
    expect(thumb).toHaveAttribute("aria-valuenow", "60");

    await fireEvent.pointerMove(root, { clientX: 150, pointerId: 1 });
    expect(oninput).toHaveBeenLastCalledWith({ time: 180 });

    // A timeupdate while the thumb is held does not move it.
    await rerender({ currentTime: 66 });
    expect(thumb).toHaveAttribute("aria-valuenow", "180");
    expect(onchange).not.toHaveBeenCalled();

    await fireEvent.pointerUp(root, { pointerId: 1 });
    expect(onchange).toHaveBeenCalledTimes(1);
    expect(onchange).toHaveBeenCalledWith({ time: 180 });
    expect(thumb).toHaveAttribute("aria-valuenow", "66");
  });

  it("shows the time under the pointer, with its chapter, while hovering", async () => {
    const { root } = setup({
      chapters: [
        { start: 0, end: 60, title: "Intro" },
        { start: 60, end: 240, title: "Setup" },
      ],
    });

    await fireEvent.pointerMove(root, { clientX: 100, pointerType: "mouse" });

    const preview = document.querySelector(".bx--media-scrubber__preview");
    expect(preview).toHaveTextContent("2:00");
    expect(preview).toHaveTextContent("Setup");
    expect(preview).toHaveAttribute("aria-hidden", "true");

    await fireEvent.pointerLeave(root);
    expect(document.querySelector(".bx--media-scrubber__preview")).toBeNull();
  });
});
