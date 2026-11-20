import { get } from "svelte/store";
import { createMediaState } from "../../src/MediaPlayer/media-state.js";

class TrackList extends EventTarget {
  items: Array<Record<string, unknown>> = [];
  get length() {
    return this.items.length;
  }
}

/** A `TextTrackList`: the tracks are also read by index. */
function FakeTrackList() {
  const list = new TrackList();
  return new Proxy(list, {
    get(target, key) {
      if (typeof key === "string" && /^\d+$/.test(key)) {
        return target.items[Number(key)];
      }
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

/** The parts of a media element the state reads, with the events it fires. */
class FakeMedia extends EventTarget {
  paused = true;
  ended = false;
  seeking = false;
  duration = Number.NaN;
  currentTime = 0;
  volume = 1;
  muted = false;
  playbackRate = 1;
  readyState = 0;
  error: null | { code: number; message: string } = null;
  ranges: Array<[number, number]> = [];
  textTracks = FakeTrackList();
  played = 0;
  fastSeeks: number[] = [];

  get buffered() {
    const ranges = this.ranges;
    return {
      length: ranges.length,
      start: (i: number) => ranges[i][0],
      end: (i: number) => ranges[i][1],
    };
  }

  querySelectorAll() {
    return [];
  }

  play() {
    this.played++;
    this.paused = false;
    this.dispatchEvent(new Event("play"));
    return Promise.resolve();
  }

  pause() {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }

  fastSeek(time: number) {
    this.fastSeeks.push(time);
    this.currentTime = time;
  }

  fire(type: string) {
    this.dispatchEvent(new Event(type));
  }
}

function setup() {
  const media = new FakeMedia();
  const state = createMediaState();
  state.attach(media as unknown as HTMLMediaElement);
  return { media, state };
}

describe("createMediaState", () => {
  it("holds defaults and touches no media until attached", () => {
    const state = createMediaState();

    expect(get(state)).toMatchObject({
      paused: true,
      duration: 0,
      buffered: [],
      textTracks: [],
    });
    expect(() => state.play()).not.toThrow();
    expect(() => state.seek(5)).not.toThrow();
  });

  it("follows the events of the media", () => {
    const { media, state } = setup();
    media.duration = 120;
    media.readyState = 4;
    media.fire("loadedmetadata");
    media.currentTime = 12.5;
    media.fire("timeupdate");

    expect(get(state)).toMatchObject({ duration: 120, currentTime: 12.5 });
  });

  it("reports waiting while playing without the data to go on", () => {
    const { media, state } = setup();
    media.paused = false;
    media.readyState = 2;
    media.fire("waiting");
    expect(get(state).waiting).toBe(true);

    media.readyState = 4;
    media.fire("playing");
    expect(get(state).waiting).toBe(false);

    media.paused = true;
    media.readyState = 1;
    media.fire("pause");
    expect(get(state).waiting).toBe(false);
  });

  it("reports seeking from the start of a seek to its end", () => {
    const { media, state } = setup();
    media.seeking = true;
    media.fire("seeking");
    expect(get(state).seeking).toBe(true);

    media.seeking = false;
    media.fire("seeked");
    expect(get(state).seeking).toBe(false);
  });

  it("reads the buffered ranges, and keeps the same array while they hold", () => {
    const { media, state } = setup();
    media.ranges = [[0, 4]];
    media.fire("progress");
    const first = get(state).buffered;
    expect(first).toEqual([[0, 4]]);

    media.fire("progress");
    expect(get(state).buffered).toBe(first);

    media.ranges = [[0, 9]];
    media.fire("progress");
    expect(get(state).buffered).toEqual([[0, 9]]);
  });

  it("tells subscribers only when something changed", () => {
    const { media, state } = setup();
    media.duration = 60;
    media.fire("durationchange");
    const seen = vi.fn();
    const stop = state.subscribe(seen);
    seen.mockClear();

    media.fire("timeupdate");
    media.fire("timeupdate");
    expect(seen).not.toHaveBeenCalled();

    media.currentTime = 1;
    media.fire("timeupdate");
    expect(seen).toHaveBeenCalledTimes(1);
    stop();
  });

  it("clamps a seek to the duration and can seek by keyframe", () => {
    const { media, state } = setup();
    media.duration = 60;

    state.seek(90);
    expect(media.currentTime).toBe(60);
    state.seek(-5);
    expect(media.currentTime).toBe(0);
    state.seek(20, { fast: true });
    expect(media.fastSeeks).toEqual([20]);
    state.seekBy(10);
    expect(media.currentTime).toBe(30);
  });

  it("ignores a seek to a time that is not a number", () => {
    const { media, state } = setup();
    media.duration = 60;
    media.currentTime = 3;

    state.seek(Number.NaN);

    expect(media.currentTime).toBe(3);
  });

  it("unmutes when the volume goes up, and from zero volume", () => {
    const { media, state } = setup();
    state.setMuted(true);
    state.setVolume(0.4);
    expect(media).toMatchObject({ muted: false, volume: 0.4 });

    state.setVolume(0);
    state.toggleMute();
    expect(media).toMatchObject({ muted: false, volume: 1 });
    state.toggleMute();
    expect(media.muted).toBe(true);
  });

  it("never rejects when the browser refuses to play", async () => {
    const { media, state } = setup();
    media.play = () =>
      Promise.reject(new DOMException("no", "NotAllowedError"));

    await expect(state.play()).resolves.toBeUndefined();
  });

  it("toggles between play and pause, and plays again after the end", async () => {
    const { media, state } = setup();
    await state.toggle();
    expect(media.paused).toBe(false);
    await state.toggle();
    expect(media.paused).toBe(true);

    media.ended = true;
    await state.toggle();
    expect(media.played).toBe(2);
  });

  it("lists caption tracks, shows one at a time, and toggles them", () => {
    const { media, state } = setup();
    media.textTracks.items = [
      {
        kind: "captions",
        label: "English",
        language: "en",
        id: "",
        mode: "disabled",
      },
      {
        kind: "subtitles",
        label: "Español",
        language: "es",
        id: "",
        mode: "disabled",
      },
      {
        kind: "chapters",
        label: "",
        language: "en",
        id: "",
        mode: "disabled",
        cues: null,
      },
    ];
    media.textTracks.dispatchEvent(new Event("addtrack"));

    expect(get(state).textTracks.map((track) => track.label)).toEqual([
      "English",
      "Español",
    ]);

    state.setTextTrack("1");
    expect(media.textTracks.items.map((track) => track.mode)).toEqual([
      "disabled",
      "showing",
      "hidden",
    ]);
    expect(get(state).textTracks[1].mode).toBe("showing");

    state.toggleCaptions();
    expect(media.textTracks.items[1].mode).toBe("disabled");
    state.toggleCaptions();
    expect(media.textTracks.items[1].mode).toBe("showing");
  });

  it("reads the chapters of a chapters track once its cues load", () => {
    const { media, state } = setup();
    media.duration = 60;
    media.textTracks.items = [
      {
        kind: "chapters",
        label: "",
        language: "en",
        id: "",
        mode: "disabled",
        cues: [
          { startTime: 0, endTime: 30, text: "One" },
          { startTime: 30, endTime: 60, text: "Two" },
        ],
      },
    ];
    media.fire("loadedmetadata");

    expect(get(state).chapters).toEqual([
      { start: 0, end: 30, title: "One" },
      { start: 30, end: 60, title: "Two" },
    ]);
  });

  it("stops following the media when detached", () => {
    const { media, state } = setup();
    state.destroy();

    media.currentTime = 9;
    media.fire("timeupdate");

    expect(get(state).currentTime).toBe(0);
  });
});
