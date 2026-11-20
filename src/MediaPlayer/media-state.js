// @ts-check
import { writable } from "svelte/store";
import {
  rangesToArray,
  resolveChapters,
  sameRanges,
} from "../utils/media-time.js";

/**
 * @typedef {import("./media-state.js").MediaState} MediaState
 * @typedef {import("./media-state.js").MediaTextTrack} MediaTextTrack
 */

const MEDIA_EVENTS = [
  "loadstart",
  "loadedmetadata",
  "loadeddata",
  "durationchange",
  "progress",
  "canplay",
  "canplaythrough",
  "waiting",
  "stalled",
  "playing",
  "play",
  "pause",
  "ended",
  "emptied",
  "seeking",
  "seeked",
  "timeupdate",
  "ratechange",
  "volumechange",
  "error",
  "enterpictureinpicture",
  "leavepictureinpicture",
];

const HAVE_FUTURE_DATA = 3;

/** @returns {MediaState} */
function initialState() {
  return {
    paused: true,
    ended: false,
    seeking: false,
    waiting: false,
    currentTime: 0,
    duration: 0,
    buffered: [],
    volume: 1,
    muted: false,
    playbackRate: 1,
    readyState: 0,
    error: null,
    textTracks: [],
    chapters: [],
    fullscreen: false,
    pictureInPicture: false,
    canFullscreen: false,
    canPictureInPicture: false,
  };
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** @returns {Element | null} */
function fullscreenElement() {
  const doc = /** @type {any} */ (document);
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/**
 * Create the state of one media element as a store, with the actions that
 * change it. Nothing touches the media element or the DOM until `attach`,
 * so it is safe to create on the server. Subscribers are called only when a
 * field changed, so a `timeupdate` that moves nothing is free.
 *
 * Fullscreen asks for the container passed to `attach`, so the controls go
 * with the video. Where only the video can go fullscreen (iPhone Safari),
 * it asks for the video.
 * @returns {import("./media-state.js").MediaStateStore}
 */
export function createMediaState() {
  const store = writable(initialState());
  let current = initialState();
  /** @type {null | HTMLMediaElement} */
  let media = null;
  /** @type {null | HTMLElement} */
  let container = null;
  /** @type {null | (() => void)} */
  let release = null;
  let tracksKey = "";
  let chaptersKey = "";
  /** @type {string} */
  let lastCaptionId = "";

  /** @returns {MediaTextTrack[]} */
  function readTextTracks() {
    if (!media) return [];
    /** @type {MediaTextTrack[]} */
    const list = [];
    for (let i = 0; i < (media.textTracks?.length ?? 0); i++) {
      const track = media.textTracks[i];
      if (track.kind !== "subtitles" && track.kind !== "captions") continue;
      list.push({
        id: track.id || String(i),
        kind: track.kind,
        label: track.label || track.language || `Track ${list.length + 1}`,
        language: track.language,
        mode: track.mode,
      });
    }
    return list;
  }

  /**
   * Chapters load only for a track that is not disabled, so the chapters
   * track is set to hidden: its cues load and nothing is drawn.
   * @param {number} duration
   */
  function readChapters(duration) {
    if (!media) return [];
    for (let i = 0; i < (media.textTracks?.length ?? 0); i++) {
      const track = media.textTracks[i];
      if (track.kind !== "chapters") continue;
      if (track.mode === "disabled") track.mode = "hidden";
      const cues = track.cues ? Array.from(track.cues) : [];
      if (cues.length === 0) continue;
      return resolveChapters(
        cues.map((cue) => ({
          startTime: cue.startTime,
          endTime: cue.endTime,
          text: /** @type {VTTCue} */ (cue).text,
        })),
        duration,
      );
    }
    return [];
  }

  /**
   * @param {MediaError | null} error
   * @returns {MediaState["error"]}
   */
  function readError(error) {
    if (!error) return null;
    const known = current.error;
    if (known && known.code === error.code && known.message === error.message) {
      return known;
    }
    return { code: error.code, message: error.message };
  }

  function sync() {
    if (!media) return;
    const duration = Number.isFinite(media.duration) ? media.duration : 0;
    const buffered = rangesToArray(media.buffered);
    const textTracks = readTextTracks();
    const nextTracksKey = JSON.stringify(textTracks);
    const chapters = readChapters(duration);
    const nextChaptersKey = JSON.stringify(chapters);
    const doc = /** @type {any} */ (document);
    const anyFullscreen = !!(
      doc.fullscreenEnabled || doc.webkitFullscreenEnabled
    );
    const video = /** @type {any} */ (media);

    /** @type {MediaState} */
    const next = {
      paused: media.paused,
      ended: media.ended,
      seeking: media.seeking,
      waiting:
        !media.paused &&
        !media.ended &&
        !media.error &&
        media.readyState < HAVE_FUTURE_DATA,
      currentTime: media.currentTime,
      duration,
      buffered: sameRanges(buffered, current.buffered)
        ? current.buffered
        : buffered,
      volume: media.volume,
      muted: media.muted,
      playbackRate: media.playbackRate,
      readyState: media.readyState,
      error: readError(media.error),
      textTracks: nextTracksKey === tracksKey ? current.textTracks : textTracks,
      chapters: nextChaptersKey === chaptersKey ? current.chapters : chapters,
      fullscreen: fullscreenElement() === (container ?? media),
      pictureInPicture:
        !!doc.pictureInPictureElement && doc.pictureInPictureElement === media,
      canFullscreen:
        (anyFullscreen &&
          !!(
            (container ?? media).requestFullscreen ||
            /** @type {any} */ (container ?? media).webkitRequestFullscreen
          )) ||
        !!video.webkitSupportsFullscreen,
      canPictureInPicture:
        !!doc.pictureInPictureEnabled &&
        media instanceof HTMLVideoElement &&
        !media.disablePictureInPicture,
    };
    tracksKey = nextTracksKey;
    chaptersKey = nextChaptersKey;

    let changed = false;
    for (const key of /** @type {Array<keyof MediaState>} */ (
      Object.keys(next)
    )) {
      if (next[key] !== current[key]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    current = next;
    store.set(next);
  }

  function detach() {
    release?.();
    release = null;
    media = null;
    container = null;
    tracksKey = "";
    chaptersKey = "";
    current = initialState();
    store.set(current);
  }

  /**
   * @param {HTMLMediaElement} element
   * @param {{ container?: HTMLElement | null }} [options]
   * @returns {() => void}
   */
  function attach(element, options = {}) {
    detach();
    media = element;
    container = options.container ?? null;
    const target = element;
    const textTracks = target.textTracks;

    for (const name of MEDIA_EVENTS) target.addEventListener(name, sync);
    textTracks.addEventListener?.("addtrack", sync);
    textTracks.addEventListener?.("removetrack", sync);
    textTracks.addEventListener?.("change", sync);
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    // iPhone Safari leaves fullscreen through the video, not the document.
    target.addEventListener("webkitendfullscreen", sync);
    // A `<track>` loads its cues after the text track exists.
    const trackElements = Array.from(target.querySelectorAll("track"));
    for (const track of trackElements) track.addEventListener("load", sync);

    release = () => {
      for (const name of MEDIA_EVENTS) target.removeEventListener(name, sync);
      textTracks.removeEventListener?.("addtrack", sync);
      textTracks.removeEventListener?.("removetrack", sync);
      textTracks.removeEventListener?.("change", sync);
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
      target.removeEventListener("webkitendfullscreen", sync);
      for (const track of trackElements) {
        track.removeEventListener("load", sync);
      }
    };
    sync();
    return detach;
  }

  /** @returns {Promise<void>} */
  async function play() {
    if (!media) return;
    try {
      await media.play();
    } catch {
      // An interrupted `play()` (a pause or a new source) or one the
      // browser blocks until a gesture rejects. The state events say why.
    }
  }

  function pause() {
    media?.pause();
  }

  function toggle() {
    if (!media) return Promise.resolve();
    if (media.paused || media.ended) return play();
    media.pause();
    return Promise.resolve();
  }

  /**
   * @param {number} time
   * @param {{ fast?: boolean }} [options]
   */
  function seek(time, options = {}) {
    if (!media || !Number.isFinite(time)) return;
    const duration = Number.isFinite(media.duration)
      ? media.duration
      : Number.POSITIVE_INFINITY;
    const target = clamp(time, 0, duration);
    const element = /** @type {any} */ (media);
    if (options.fast && typeof element.fastSeek === "function") {
      element.fastSeek(target);
    } else {
      media.currentTime = target;
    }
    sync();
  }

  /** @param {number} delta */
  function seekBy(delta) {
    if (media) seek(media.currentTime + delta);
  }

  /** @param {number} volume */
  function setVolume(volume) {
    if (!media) return;
    media.volume = clamp(volume, 0, 1);
    if (media.volume > 0) media.muted = false;
    sync();
  }

  /** @param {boolean} muted */
  function setMuted(muted) {
    if (!media) return;
    media.muted = muted;
    sync();
  }

  function toggleMute() {
    if (!media) return;
    // Unmuting from zero volume would stay silent.
    if (media.muted || media.volume === 0) {
      if (media.volume === 0) media.volume = 1;
      media.muted = false;
    } else {
      media.muted = true;
    }
    sync();
  }

  /** @param {number} rate */
  function setPlaybackRate(rate) {
    if (!media || !(rate > 0)) return;
    media.playbackRate = rate;
    sync();
  }

  /**
   * Show one caption or subtitle track, and hide the others. `null` hides
   * them all.
   * @param {string | null} id
   */
  function setTextTrack(id) {
    if (!media) return;
    for (let i = 0; i < (media.textTracks?.length ?? 0); i++) {
      const track = media.textTracks[i];
      if (track.kind !== "subtitles" && track.kind !== "captions") continue;
      const showing = id !== null && (track.id || String(i)) === id;
      track.mode = showing ? "showing" : "disabled";
      if (showing) lastCaptionId = id ?? "";
    }
    sync();
  }

  /** Turn captions off, or back on with the track last shown. */
  function toggleCaptions() {
    const showing = current.textTracks.find(
      (track) => track.mode === "showing",
    );
    if (showing) {
      lastCaptionId = showing.id;
      setTextTrack(null);
      return;
    }
    const next =
      current.textTracks.find((track) => track.id === lastCaptionId) ??
      current.textTracks[0];
    if (next) setTextTrack(next.id);
  }

  async function toggleFullscreen() {
    if (!media) return;
    const doc = /** @type {any} */ (document);
    const target = /** @type {any} */ (container ?? media);
    const video = /** @type {any} */ (media);
    try {
      if (fullscreenElement()) {
        await (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
      } else if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    } catch {
      // The browser refuses without a user gesture or inside a frame that
      // does not allow it; the button then does nothing.
    }
    sync();
  }

  async function togglePictureInPicture() {
    if (!media) return;
    const doc = /** @type {any} */ (document);
    try {
      if (doc.pictureInPictureElement === media) {
        await doc.exitPictureInPicture();
      } else if (
        /** @type {any} */ (media).requestPictureInPicture &&
        current.canPictureInPicture
      ) {
        await /** @type {any} */ (media).requestPictureInPicture();
      }
    } catch {
      // Refused: no gesture, or the page's policy blocks it.
    }
    sync();
  }

  return {
    subscribe: store.subscribe,
    attach,
    destroy: detach,
    sync,
    play,
    pause,
    toggle,
    seek,
    seekBy,
    setVolume,
    setMuted,
    toggleMute,
    setPlaybackRate,
    setTextTrack,
    toggleCaptions,
    toggleFullscreen,
    togglePictureInPicture,
  };
}
