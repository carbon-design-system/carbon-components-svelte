import type { Readable } from "svelte/store";

/** A caption or subtitle track of a media element. */
export interface MediaTextTrack {
  /** The track's `id`, else its position in `textTracks`. */
  id: string;
  kind: "subtitles" | "captions";
  label: string;
  language: string;
  mode: "disabled" | "hidden" | "showing";
}

export interface MediaState {
  paused: boolean;
  ended: boolean;
  seeking: boolean;
  /** `true` while playing is stalled for want of data. */
  waiting: boolean;
  currentTime: number;
  /** `0` until the metadata loads, and for a live stream. */
  duration: number;
  /** The buffered ranges as `[start, end]` pairs, in seconds. */
  buffered: Array<[number, number]>;
  volume: number;
  muted: boolean;
  playbackRate: number;
  readyState: number;
  error: null | { code: number; message: string };
  textTracks: MediaTextTrack[];
  /** The chapters of a `kind="chapters"` text track. */
  chapters: Array<{ start: number; end: number; title: string }>;
  fullscreen: boolean;
  pictureInPicture: boolean;
  canFullscreen: boolean;
  canPictureInPicture: boolean;
}

export interface MediaStateStore extends Readable<MediaState> {
  /**
   * Follow a media element. Returns a function that stops following it.
   * Pass the element fullscreen should ask for as `container`, so the
   * controls go with the video.
   */
  attach(
    element: HTMLMediaElement,
    options?: { container?: HTMLElement | null },
  ): () => void;
  /** Stop following the media element. */
  destroy(): void;
  /** Read the media element again. Events do this for you. */
  sync(): void;
  /** Play. Resolves when the browser accepts or refuses; never rejects. */
  play(): Promise<void>;
  pause(): void;
  toggle(): Promise<void>;
  /** Seek to a time in seconds, clamped to the duration. */
  seek(time: number, options?: { fast?: boolean }): void;
  seekBy(delta: number): void;
  /** Set the volume from 0 to 1. A volume above 0 unmutes. */
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  toggleMute(): void;
  setPlaybackRate(rate: number): void;
  /** Show one caption track by id, hiding the others; `null` hides all. */
  setTextTrack(id: string | null): void;
  toggleCaptions(): void;
  toggleFullscreen(): Promise<void>;
  togglePictureInPicture(): Promise<void>;
}

/**
 * Create the state of one media element as a store, with the actions that
 * change it. Nothing reads the media element until `attach`, so it is safe
 * to create on the server.
 */
export function createMediaState(): MediaStateStore;
