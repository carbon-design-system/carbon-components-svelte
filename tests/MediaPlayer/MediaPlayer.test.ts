import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { user } from "../utils/user";
import MediaPlayer from "./MediaPlayer.test.svelte";

// jsdom has no media pipeline: the element's properties are plain fields,
// and the events are the test's to fire.
let plays = 0;
let pauses = 0;

beforeEach(() => {
  plays = 0;
  pauses = 0;
  vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    plays++;
    Object.defineProperty(this, "paused", { value: false, configurable: true });
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    pauses++;
    Object.defineProperty(this, "paused", { value: true, configurable: true });
    this.dispatchEvent(new Event("pause"));
  });
});

const player = () => screen.getByTestId("player");
const media = () => player().querySelector("video") as HTMLVideoElement;

/** Tell the player the media loaded, as the browser would. */
async function load(duration = 240) {
  Object.defineProperty(media(), "duration", {
    value: duration,
    configurable: true,
  });
  Object.defineProperty(media(), "readyState", {
    value: 4,
    configurable: true,
  });
  await fireEvent(media(), new Event("loadedmetadata"));
}

describe("MediaPlayer", () => {
  it("is a named region, with the controls drawn and the scrubber waiting for the length", () => {
    render(MediaPlayer);

    expect(
      screen.getByRole("region", { name: "Media player" }),
    ).toBeInTheDocument();
    expect(media()).not.toHaveAttribute("controls");
    expect(screen.getByRole("slider", { name: "Seek" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("button", { name: "Play" })).toBeInTheDocument();
  });

  it("reads the length from the media", async () => {
    render(MediaPlayer);
    await load();

    const seek = screen.getByRole("slider", { name: "Seek" });
    expect(seek).toHaveAttribute("aria-valuemax", "240");
    expect(player().querySelector(".bx--media-player__time")).toHaveTextContent(
      "0:00 / 4:00",
    );
  });

  it("plays and pauses from the button and the K key, and reports it", async () => {
    render(MediaPlayer);
    await load();

    await user.click(screen.getByRole("button", { name: "Play" }));
    expect(plays).toBe(1);
    expect(screen.getByTestId("bound")).toHaveTextContent("false");
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();

    player().focus();
    await user.keyboard("k");
    expect(pauses).toBe(1);
    expect(screen.getByTestId("bound")).toHaveTextContent("true");
  });

  it("applies a starting volume, mute and speed to the media", async () => {
    render(MediaPlayer, {
      props: { volume: 0.3, muted: true, playbackRate: 1.5 },
    });
    await tick();

    expect(media().volume).toBeCloseTo(0.3);
    expect(media().muted).toBe(true);
    expect(media().playbackRate).toBe(1.5);
    expect(screen.getByTestId("bound")).toHaveTextContent("0.3 true 1.5");
  });

  it("seeks when currentTime is set, and publishes the media's time", async () => {
    const { rerender } = render(MediaPlayer);
    await load();

    await rerender({ currentTime: 42 });
    expect(media().currentTime).toBe(42);

    media().currentTime = 43;
    await fireEvent(media(), new Event("timeupdate"));
    expect(screen.getByTestId("bound")).toHaveTextContent("43");
    // Publishing the time must not seek again.
    expect(media().currentTime).toBe(43);
  });

  it("takes shortcuts from inside the player, not from a field or a menu", async () => {
    render(MediaPlayer);
    await load();

    screen.getByRole("textbox", { name: "Note" }).focus();
    await user.keyboard("k");
    expect(plays).toBe(0);

    await user.click(screen.getByRole("button", { name: /Playback speed/ }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    await user.keyboard("k");
    expect(plays).toBe(0);
    await user.keyboard("{Escape}");

    screen.getByRole("button", { name: "Mute" }).focus();
    await user.keyboard("m");
    expect(screen.getByTestId("bound")).toHaveTextContent("0 1 true 1");
  });

  it("turns the shortcuts off", async () => {
    render(MediaPlayer, { props: { shortcuts: false } });
    await load();

    player().focus();
    await user.keyboard("k");

    expect(plays).toBe(0);
    expect(
      screen.queryByRole("button", { name: "Keyboard shortcuts" }),
    ).toBeNull();
  });

  it("steps the speed with < and >, within 0.5x to 2x", async () => {
    render(MediaPlayer);
    await load();
    player().focus();

    await user.keyboard(">>");
    expect(media().playbackRate).toBe(1.5);
    await user.keyboard("<<<<<<<<<");
    expect(media().playbackRate).toBe(0.5);
  });

  it("opens the shortcut help with ?, locks the controls under it, and gives focus back", async () => {
    render(MediaPlayer);
    await load();
    player().focus();

    await user.keyboard("?");
    const dialog = screen.getByRole("dialog", { name: "Keyboard shortcuts" });
    expect(dialog.querySelectorAll("dt")).toHaveLength(13);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    const stage = player().querySelector<HTMLElement>(
      ".bx--media-player__stage",
    );
    // jsdom reflects `inert` neither way, so accept the property or the attribute.
    expect(stage?.inert || stage?.hasAttribute("inert")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(player()).toHaveFocus();
  });

  it("announces a shortcut's effect for screen readers", async () => {
    render(MediaPlayer);
    await load();
    player().focus();

    await user.keyboard("k");

    expect(screen.getByRole("status")).toHaveTextContent("Playing");
  });

  it("holds the seek during a drag to one per frame", async () => {
    const frames: Array<() => void> = [];
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
      frames.push(callback);
      return frames.length;
    });
    try {
      const { container } = render(MediaPlayer);
      await load();
      const track = container.querySelector(".bx--media-scrubber__track");
      assert(track instanceof HTMLElement);
      vi.spyOn(track, "getBoundingClientRect").mockReturnValue({
        left: 0,
        width: 240,
        right: 240,
        top: 0,
        bottom: 4,
        height: 4,
        x: 0,
        y: 0,
        toJSON() {},
      });
      const root = container.querySelector(".bx--media-scrubber");
      assert(root instanceof HTMLElement);
      const seeks: number[] = [];
      Object.defineProperty(media(), "currentTime", {
        configurable: true,
        get: () => seeks.at(-1) ?? 0,
        set: (value: number) => seeks.push(value),
      });

      await fireEvent.pointerDown(root, { clientX: 10, pointerId: 1 });
      await fireEvent.pointerMove(root, { clientX: 20, pointerId: 1 });
      await fireEvent.pointerMove(root, { clientX: 30, pointerId: 1 });
      expect(seeks).toEqual([]);

      for (const frame of frames.splice(0)) frame();
      expect(seeks).toEqual([30]);

      await fireEvent.pointerUp(root, { pointerId: 1 });
      expect(seeks).toEqual([30, 30]);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("is a compact bar with no fullscreen or picture for audio", () => {
    render(MediaPlayer, { props: { variant: "audio" } });

    expect(player()).toHaveClass("bx--media-player--audio");
    expect(player().querySelector("audio")).not.toBeNull();
    expect(player().querySelector("video")).toBeNull();
    expect(screen.queryByRole("button", { name: "Fullscreen" })).toBeNull();
  });
});
