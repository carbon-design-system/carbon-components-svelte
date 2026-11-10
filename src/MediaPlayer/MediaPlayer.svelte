<script>
  /**
   * @typedef {"region" | "play" | "pause" | "mute" | "unmute" | "volume" | "fullscreen" | "exitFullscreen" | "pictureInPicture" | "exitPictureInPicture" | "captions" | "captionsOff" | "captionsOn" | "speed" | "seek" | "shortcuts" | "close" | "buffering" | "error" | "playing" | "paused" | "muted" | "unmuted" | "playPause" | "back" | "forward" | "slower" | "faster" | "help" | "seekBack" | "seekForward" | "volumeUp" | "volumeDown"} MediaPlayerTranslationId
   * @typedef {{ src: string; kind?: "subtitles" | "captions" | "chapters" | "descriptions" | "metadata"; srclang?: string; label?: string; default?: boolean }} MediaPlayerTrack
   * @typedef {{ start: number; end?: number; title: string }} MediaPlayerChapter
   * @restProps {div}
   * @event {Event} play
   * @event {Event} pause
   * @event {Event} ended
   * @event {Event} error
   * @event {Event} loadedmetadata
   * @event {Event} seeked
   * @event {Event} ratechange
   * @event {Event} volumechange
   * @slot {{}} - Children of the media element: `<source>` and `<track>` elements.
   * @slot {{ state: import("./media-state.js").MediaState; actions: import("./media-state.js").MediaStateStore }} controls - Replace the controls. `actions` is the state store: call `actions.toggle()`, `actions.seek(time)` and the rest.
   */

  /**
   * Specify the media source. Leave it unset to use `<source>` elements in
   * the default slot.
   * @type {string | undefined}
   */
  export let src = undefined;

  /**
   * Specify what the player shows: `"video"` draws the video with controls
   * over it, and `"audio"` a compact bar.
   * @type {"video" | "audio"}
   */
  export let variant = "video";

  /**
   * Specify the image shown before the video plays.
   * @type {string | undefined}
   */
  export let poster = undefined;

  /**
   * Specify the caption, subtitle and chapter tracks. For a track the
   * markup holds, use `<track>` in the default slot instead.
   * @type {ReadonlyArray<MediaPlayerTrack>}
   */
  export let tracks = [];

  /**
   * Specify the chapters. They replace the cues of a `kind="chapters"`
   * track, and show on the scrubber from the first paint.
   * @type {ReadonlyArray<MediaPlayerChapter> | undefined}
   */
  export let chapters = undefined;

  /**
   * Specify how much to load before play.
   * @type {"none" | "metadata" | "auto"}
   */
  export let preload = "metadata";

  /**
   * Specify `crossorigin` for the media and its tracks. A caption file on
   * another origin needs `"anonymous"` and a CORS header.
   * @type {"anonymous" | "use-credentials" | undefined}
   */
  export let crossorigin = undefined;

  /** Set to `true` to start playing once the media can. */
  export let autoplay = false;

  /** Set to `true` to start over when the media ends. */
  export let loop = false;

  /**
   * Specify the video's aspect ratio as a CSS `aspect-ratio`, so the player
   * holds its size while the video loads. Use `"auto"` to size it from the
   * video.
   */
  export let aspectRatio = "16 / 9";

  /**
   * Whether the media is paused. Set it to play or pause.
   * @bindable writable
   */
  export let paused = true;

  /**
   * The playback position in seconds. Set it to seek.
   * @bindable writable
   */
  export let currentTime = 0;

  /**
   * The volume from 0 to 1.
   * @bindable writable
   */
  export let volume = 1;

  /**
   * Whether the sound is muted.
   * @bindable writable
   */
  export let muted = false;

  /**
   * The speed, where 1 is normal.
   * @bindable writable
   */
  export let playbackRate = 1;

  /**
   * Specify the speeds the speed menu offers.
   * @type {ReadonlyArray<number>}
   */
  export let playbackRates = PLAYBACK_RATES;

  /** Specify how many seconds the arrow keys on the scrubber move. */
  export let seekStep = 5;

  /** Specify how many seconds `J` and `L` skip. */
  export let skipStep = 10;

  /**
   * Set to `false` to keep the controls on screen during playback. They
   * never hide while paused, while focus is inside them by keyboard, or
   * when the user prefers reduced motion.
   */
  export let autoHide = true;

  /** Specify how many milliseconds the pointer rests before the controls hide. */
  export let autoHideDelay = 3000;

  /**
   * Set to `false` to turn off the keyboard shortcuts. They apply only
   * while focus is inside the player.
   */
  export let shortcuts = true;

  /**
   * Specify the locale that writes times and speeds in words.
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Override the default text. The ids name what each string says, such as
   * `"play"`, and the shortcut help rows, such as `"playPause"`.
   * @type {(id: MediaPlayerTranslationId) => string}
   */
  export let translateWithId = defaultTranslate;

  /**
   * Pass your own state store, from `createMediaState`, to read the state
   * or call the actions from outside, or to build the controls yourself.
   * @type {import("./media-state.js").MediaStateStore}
   */
  export let mediaState = createMediaState();

  /**
   * Obtain a reference to the `video` or `audio` element.
   * @bindable readonly
   * @type {null | HTMLVideoElement | HTMLAudioElement}
   */
  export let ref = null;

  import { onMount, tick } from "svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import Loading from "../Loading/Loading.svelte";
  import Menu from "../Menu/Menu.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import MenuItemRadioGroup from "../Menu/MenuItemRadioGroup.svelte";
  import ClosedCaption from "../icons/ClosedCaption.svelte";
  import ClosedCaptionFilled from "../icons/ClosedCaptionFilled.svelte";
  import Keyboard from "../icons/Keyboard.svelte";
  import Maximize from "../icons/Maximize.svelte";
  import Minimize from "../icons/Minimize.svelte";
  import Pause from "../icons/Pause.svelte";
  import PictureInPicture from "../icons/PictureInPicture.svelte";
  import Play from "../icons/Play.svelte";
  import VolumeDown from "../icons/VolumeDown.svelte";
  import VolumeMute from "../icons/VolumeMute.svelte";
  import VolumeUp from "../icons/VolumeUp.svelte";
  import { ariaKeyShortcuts } from "../utils/keyboard-shortcut.js";
  import {
    formatClock,
    formatRate,
    PLAYBACK_RATES,
    stepRate,
  } from "../utils/media-time.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";
  import MediaScrubber from "./MediaScrubber.svelte";
  import {
    MEDIA_SHORTCUTS,
    mediaShortcutAction,
    shortcutScope,
  } from "./media-shortcuts.js";
  import { createMediaState } from "./media-state.js";

  const TEXT = {
    region: "Media player",
    play: "Play",
    pause: "Pause",
    mute: "Mute",
    unmute: "Unmute",
    volume: "Volume",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    pictureInPicture: "Picture in picture",
    exitPictureInPicture: "Exit picture in picture",
    captions: "Captions",
    captionsOff: "Off",
    captionsOn: "Captions on",
    speed: "Playback speed",
    seek: "Seek",
    shortcuts: "Keyboard shortcuts",
    close: "Close",
    buffering: "Buffering",
    error: "This media can't be played.",
    playing: "Playing",
    paused: "Paused",
    muted: "Muted",
    unmuted: "Unmuted",
    playPause: "Play or pause",
    back: "Back 10 seconds",
    forward: "Forward 10 seconds",
    slower: "Slower",
    faster: "Faster",
    help: "Show shortcuts",
    seekBack: "Back 5 seconds",
    seekForward: "Forward 5 seconds",
    volumeUp: "Volume up",
    volumeDown: "Volume down",
  };

  /** @param {MediaPlayerTranslationId} id */
  function defaultTranslate(id) {
    return TEXT[id];
  }

  const state = mediaState;

  /** @type {null | HTMLDivElement} */
  let root = null;
  /** @type {null | HTMLElement} */
  let speedButton = null;
  /** @type {null | HTMLElement} */
  let captionsButton = null;
  /** @type {null | HTMLElement} */
  let helpButton = null;
  /** @type {null | HTMLButtonElement} */
  let helpClose = null;

  let attached = false;
  let speedOpen = false;
  let captionsOpen = false;
  let helpOpen = false;
  let announcement = "";
  let scrubbing = false;
  let scrubTime = 0;
  let idle = false;
  let keyboardFocus = false;
  let reducedMotion = false;
  let compact = false;
  /** @type {"mouse" | "touch" | "pen"} */
  let pointerType = "mouse";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let hideTimer;
  /** @type {undefined | (() => void)} */
  let stopObserving;
  let pendingSeek = -1;
  let seekFrame = 0;

  $: media = $state;
  $: isAudio = variant === "audio";

  // Publish the media's state to the bindable props only once attached;
  // before that the state holds defaults, and a prop the consumer set (a
  // starting volume) must survive.
  $: if (attached) {
    paused = media.paused;
    currentTime = media.currentTime;
    volume = media.volume;
    muted = media.muted;
    playbackRate = media.playbackRate;
  }

  // A value the consumer set differs from the state's last sample; a value
  // just published from it equals it, so only a real change gets here.
  $: applyPaused(paused);
  $: applyTime(currentTime);
  $: applyVolume(volume);
  $: applyMuted(muted);
  $: applyRate(playbackRate);

  /** @param {boolean} value */
  function applyPaused(value) {
    if (!attached || value === media.paused) return;
    if (value) state.pause();
    else state.play();
  }

  /** @param {number} value */
  function applyTime(value) {
    if (!attached || value === media.currentTime) return;
    state.seek(value);
  }

  /** @param {number} value */
  function applyVolume(value) {
    if (attached && value !== media.volume) state.setVolume(value);
  }

  /** @param {boolean} value */
  function applyMuted(value) {
    if (attached && value !== media.muted) state.setMuted(value);
  }

  /** @param {number} value */
  function applyRate(value) {
    if (attached && value !== media.playbackRate) state.setPlaybackRate(value);
  }

  $: shownTime = scrubbing ? scrubTime : media.currentTime;
  $: shownChapters = chapters
    ? chapters.map((chapter) => ({
        start: chapter.start,
        end: chapter.end ?? media.duration,
        title: chapter.title,
      }))
    : media.chapters;
  $: buffering = media.waiting || (media.seeking && media.readyState < 3);
  $: showingTrack = media.textTracks.find((track) => track.mode === "showing");
  $: captionsId = showingTrack?.id ?? "off";
  $: rateId = String(media.playbackRate);
  $: menuOpen = speedOpen || captionsOpen;
  $: canHide =
    autoHide &&
    !isAudio &&
    !media.paused &&
    !reducedMotion &&
    !menuOpen &&
    !helpOpen &&
    !keyboardFocus &&
    !scrubbing;
  $: controlsHidden = canHide && idle;
  $: canHide ? scheduleHide(autoHideDelay) : showControls();
  $: volumeIcon =
    media.muted || media.volume === 0
      ? VolumeMute
      : media.volume < 0.5
        ? VolumeDown
        : VolumeUp;
  $: volumePercent = media.muted ? 0 : Math.round(media.volume * 100);

  /** @param {number} delay */
  function scheduleHide(delay) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      idle = true;
    }, delay);
  }

  function showControls() {
    clearTimeout(hideTimer);
    idle = false;
  }

  function wake() {
    if (idle) idle = false;
    if (canHide) scheduleHide(autoHideDelay);
  }

  /** @param {string} text */
  function announce(text) {
    // The same text twice in a row would not be read again.
    announcement = announcement === text ? `${text} ` : text;
  }

  /** @param {PointerEvent} event */
  function handlePointerdown(event) {
    pointerType = /** @type {"mouse" | "touch" | "pen"} */ (event.pointerType);
  }

  /** @param {PointerEvent} event */
  function handlePointermove(event) {
    if (event.pointerType === "mouse") wake();
  }

  function handlePointerleave() {
    if (canHide) scheduleHide(Math.min(autoHideDelay, 600));
  }

  // Whether the last input on the page was a key. A clicked button takes
  // focus too, and that must not keep the controls up. `:focus-visible`
  // would say so, but WebKit sets it after `focusin`.
  let keyboardModality = false;

  function handleFocusin() {
    keyboardFocus = keyboardModality;
    wake();
  }

  /** @param {FocusEvent} event */
  function handleFocusout(event) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !root?.contains(next)) keyboardFocus = false;
  }

  function handleSurfaceClick() {
    // A touch tap on hidden controls only brings them back.
    if (pointerType === "touch" && controlsHidden) {
      wake();
      return;
    }
    state.toggle();
  }

  /** @param {KeyboardEvent} event */
  function handleKeydown(event) {
    if (helpOpen && event.key === "Escape") {
      event.preventDefault();
      closeHelp();
      return;
    }
    if (!shortcuts) return;
    const scope = shortcutScope(event.target, root);
    const action = mediaShortcutAction(event, scope);
    if (!action) return;
    event.preventDefault();
    wake();
    runShortcut(action);
  }

  /** @param {string} action */
  function runShortcut(action) {
    switch (action) {
      case "playPause": {
        const wasPaused = media.paused || media.ended;
        state.toggle();
        announce(translateWithId(wasPaused ? "playing" : "paused"));
        break;
      }
      case "mute": {
        const wasMuted = media.muted || media.volume === 0;
        state.toggleMute();
        announce(translateWithId(wasMuted ? "unmuted" : "muted"));
        break;
      }
      case "fullscreen":
        if (media.canFullscreen) state.toggleFullscreen();
        break;
      case "captions":
        toggleCaptions();
        break;
      case "back":
        state.seekBy(-skipStep);
        break;
      case "forward":
        state.seekBy(skipStep);
        break;
      case "seekBack":
        state.seekBy(-seekStep);
        break;
      case "seekForward":
        state.seekBy(seekStep);
        break;
      case "slower":
      case "faster": {
        const rate = stepRate(
          media.playbackRate,
          action === "faster" ? 1 : -1,
          playbackRates,
        );
        state.setPlaybackRate(rate);
        announce(`${translateWithId("speed")} ${formatRate(rate, locale)}`);
        break;
      }
      case "volumeUp":
      case "volumeDown": {
        const next = Math.round(
          (media.volume + (action === "volumeUp" ? 0.05 : -0.05)) * 100,
        );
        state.setVolume(next / 100);
        announce(
          `${translateWithId("volume")} ${Math.min(100, Math.max(0, next))}%`,
        );
        break;
      }
      case "help":
        helpOpen ? closeHelp() : openHelp();
        break;
    }
  }

  function toggleCaptions() {
    if (!media.textTracks.length) return;
    state.toggleCaptions();
    announce(
      showingTrack
        ? translateWithId("captionsOff")
        : translateWithId("captionsOn"),
    );
  }

  async function openHelp() {
    helpOpen = true;
    await tick();
    helpClose?.focus();
  }

  async function closeHelp() {
    helpOpen = false;
    await tick();
    // Back to the button that opened it, else the player, so the shortcuts
    // keep working.
    (helpButton ?? root)?.focus();
  }

  /** @param {CustomEvent<{ time: number }>} event */
  function handleScrubInput(event) {
    scrubTime = event.detail.time;
    queueSeek(scrubTime);
  }

  /** @param {CustomEvent<{ time: number }>} event */
  function handleScrubChange(event) {
    scrubbing = false;
    cancelAnimationFrame(seekFrame);
    seekFrame = 0;
    pendingSeek = -1;
    state.seek(event.detail.time);
  }

  // A drag asks for a seek per pointer event, far more often than a video
  // can decode a frame. Keep the latest and seek once per frame, and not
  // while the last seek is still going (a seek into unbuffered media waits
  // on the network).
  /** @param {number} time */
  function queueSeek(time) {
    pendingSeek = time;
    if (seekFrame) return;
    seekFrame = requestAnimationFrame(flushSeek);
  }

  function flushSeek() {
    seekFrame = 0;
    if (pendingSeek < 0) return;
    if (ref?.seeking) {
      seekFrame = requestAnimationFrame(flushSeek);
      return;
    }
    state.seek(pendingSeek, { fast: true });
    pendingSeek = -1;
  }

  /** @param {Event} event */
  function handleVolumeInput(event) {
    state.setVolume(
      Number(/** @type {HTMLInputElement} */ (event.target).value) / 100,
    );
  }

  /** @param {number} rate */
  function chooseRate(rate) {
    state.setPlaybackRate(rate);
  }

  /** @param {string | null} id */
  function chooseTrack(id) {
    state.setTextTrack(id);
  }

  /** @param {HTMLElement | null} node */
  function observeSize(node) {
    stopObserving?.();
    if (!node) return;
    stopObserving = observeResize(node, (entry) => {
      compact = entry.contentRect.width < 480;
    });
  }

  $: observeSize(root);

  // Attach once the media element exists, and again if the variant swaps it.
  $: if (ref && root) attachMedia(ref, root);

  /** @type {null | HTMLMediaElement} */
  let attachedTo = null;

  /**
   * @param {HTMLMediaElement} element
   * @param {HTMLElement} container
   */
  function attachMedia(element, container) {
    if (attachedTo === element) return;
    attachedTo = element;
    // The consumer's starting values go to the media before the state reads
    // it, or the state's first sample would overwrite them.
    element.volume = volume;
    element.muted = muted;
    element.playbackRate = playbackRate;
    if (currentTime > 0) element.currentTime = currentTime;
    state.attach(element, { container });
    attached = true;
    if (!paused) state.play();
  }

  onMount(() => {
    /** @type {undefined | (() => void)} */
    let stopMotionQuery;
    if (typeof matchMedia === "function") {
      const query = matchMedia("(prefers-reduced-motion: reduce)");
      reducedMotion = query.matches;
      /** @param {MediaQueryListEvent} event */
      const onChange = (event) => {
        reducedMotion = event.matches;
      };
      query.addEventListener?.("change", onChange);
      stopMotionQuery = () => query.removeEventListener?.("change", onChange);
    }
    // Capture, so a Tab from outside the player is seen before focus lands.
    const stopKeys = addPooledListener(
      "keydown",
      () => {
        keyboardModality = true;
      },
      true,
    );
    const stopPointers = addPooledListener(
      "pointerdown",
      () => {
        keyboardModality = false;
      },
      true,
    );
    return () => {
      stopKeys();
      stopPointers();
      clearTimeout(hideTimer);
      cancelAnimationFrame(seekFrame);
      stopObserving?.();
      stopMotionQuery?.();
      state.destroy();
    };
  });
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div
  bind:this={root}
  role="region"
  aria-label={$$restProps["aria-labelledby"]
    ? undefined
    : ($$restProps["aria-label"] ?? translateWithId("region"))}
  tabindex="-1"
  {...$$restProps}
  class:bx--media-player={true}
  class:bx--media-player--video={!isAudio}
  class:bx--media-player--audio={isAudio}
  class:bx--media-player--controls-hidden={controlsHidden}
  class:bx--media-player--fullscreen={media.fullscreen}
  class:bx--media-player--compact={compact}
  style:aspect-ratio={isAudio || aspectRatio === "auto"
    ? undefined
    : aspectRatio}
  on:keydown={handleKeydown}
  on:pointerdown={handlePointerdown}
  on:pointermove={handlePointermove}
  on:pointerleave={handlePointerleave}
  on:focusin={handleFocusin}
  on:focusout={handleFocusout}
>
  <div class:bx--media-player__stage={true} inert={helpOpen ? true : undefined}>
    {#if isAudio}
      <!-- biome-ignore lint/a11y/useMediaCaption: the tracks prop and the default slot carry any captions -->
      <audio
        bind:this={ref}
        {src}
        {preload}
        {crossorigin}
        {autoplay}
        {loop}
        class:bx--media-player__media={true}
        on:play
        on:pause
        on:ended
        on:error
        on:loadedmetadata
        on:seeked
        on:ratechange
        on:volumechange
      >
        {#each tracks as track (track.src)}
          <track {...track} />
        {/each}
        <slot />
      </audio>
    {:else}
      <!-- svelte-ignore a11y-media-has-caption -->
      <!-- biome-ignore lint/a11y/useMediaCaption: the tracks prop and the default slot carry any captions -->
      <video
        bind:this={ref}
        {src}
        {poster}
        {preload}
        {crossorigin}
        {autoplay}
        {loop}
        playsinline
        class:bx--media-player__media={true}
        on:click={handleSurfaceClick}
        on:play
        on:pause
        on:ended
        on:error
        on:loadedmetadata
        on:seeked
        on:ratechange
        on:volumechange
      >
        {#each tracks as track (track.src)}
          <track {...track} />
        {/each}
        <slot />
      </video>
    {/if}

    {#if buffering && !media.error}
      <div class:bx--media-player__status={true}>
        <Loading
          small
          withOverlay={false}
          delay={300}
          description={translateWithId("buffering")}
        />
      </div>
    {/if}

    {#if media.error}
      <div role="alert" class:bx--media-player__error={true}>
        {translateWithId("error")}
      </div>
    {/if}

    <div class:bx--media-player__controls={true}>
      <slot name="controls" state={media} actions={state}>
        <MediaScrubber
          currentTime={media.currentTime}
          duration={media.duration}
          buffered={media.buffered}
          chapters={shownChapters}
          {seekStep}
          {locale}
          disabled={!!media.error}
          waiting={buffering}
          labelText={translateWithId("seek")}
          on:input={handleScrubInput}
          on:change={handleScrubChange}
          on:scrubstart={() => {
            scrubbing = true;
            scrubTime = media.currentTime;
          }}
        />
        <div
          role="group"
          aria-label="Media controls"
          class:bx--media-player__bar={true}
        >
          <button
            type="button"
            class:bx--media-player__button={true}
            aria-label={translateWithId(media.paused ? "play" : "pause")}
            aria-keyshortcuts={ariaKeyShortcuts(["space", "k"])}
            title={translateWithId(media.paused ? "play" : "pause")}
            on:click={() => state.toggle()}
          >
            <svelte:component
              this={media.paused || media.ended ? Play : Pause}
              size={20}
            />
          </button>

          <div class:bx--media-player__volume={true}>
            <button
              type="button"
              class:bx--media-player__button={true}
              aria-label={translateWithId(media.muted ? "unmute" : "mute")}
              aria-keyshortcuts={ariaKeyShortcuts("m")}
              title={translateWithId(media.muted ? "unmute" : "mute")}
              on:click={() => state.toggleMute()}
            >
              <svelte:component this={volumeIcon} size={20} />
            </button>
            {#if !compact}
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={volumePercent}
                aria-label={translateWithId("volume")}
                aria-valuetext="{volumePercent}%"
                class:bx--media-player__volume-slider={true}
                style:--ccs-media-volume="{volumePercent}%"
                on:input={handleVolumeInput}
              />
            {/if}
          </div>

          <span class:bx--media-player__time={true}>
            <bdi dir="ltr"
              >{formatClock(
                shownTime,
              )}{#if media.duration > 0}&nbsp;/&nbsp;{formatClock(
                  media.duration,
                )}{/if}</bdi
            >
          </span>

          <span class:bx--media-player__spacer={true}></span>

          <button
            bind:this={speedButton}
            type="button"
            class:bx--media-player__button={true}
            class:bx--media-player__button--text={true}
            aria-label="{translateWithId('speed')}, {formatRate(
              media.playbackRate,
              locale,
            )}"
            aria-haspopup="menu"
            aria-expanded={speedOpen ? "true" : "false"}
            title={translateWithId("speed")}
            on:mousedown|preventDefault
            on:click={() => (speedOpen = !speedOpen)}
          >
            <bdi dir="ltr">{formatRate(media.playbackRate, locale)}</bdi>
          </button>
          <Menu
            anchor={speedButton}
            bind:open={speedOpen}
            target={root}
            direction="top"
            intrinsicWidth
            intrinsicAlign="end"
            labelText={translateWithId("speed")}
          >
            <MenuItemRadioGroup
              labelText={translateWithId("speed")}
              selectedId={rateId}
            >
              {#each playbackRates as rate (rate)}
                <MenuItem
                  id={String(rate)}
                  labelText={formatRate(rate, locale)}
                  on:click={() => chooseRate(rate)}
                >
                  <bdi slot="labelChildren" dir="ltr"
                    >{formatRate(rate, locale)}</bdi
                  >
                </MenuItem>
              {/each}
            </MenuItemRadioGroup>
          </Menu>

          {#if media.textTracks.length > 0}
            <button
              bind:this={captionsButton}
              type="button"
              class:bx--media-player__button={true}
              class:bx--media-player__button--active={!!showingTrack}
              aria-label={translateWithId("captions")}
              aria-haspopup="menu"
              aria-expanded={captionsOpen ? "true" : "false"}
              aria-keyshortcuts={ariaKeyShortcuts("c")}
              title={translateWithId("captions")}
              on:mousedown|preventDefault
              on:click={() => (captionsOpen = !captionsOpen)}
            >
              <svelte:component
                this={showingTrack ? ClosedCaptionFilled : ClosedCaption}
                size={20}
              />
            </button>
            <Menu
              anchor={captionsButton}
              bind:open={captionsOpen}
              target={root}
              direction="top"
              intrinsicWidth
              intrinsicAlign="end"
              labelText={translateWithId("captions")}
            >
              <MenuItemRadioGroup
                labelText={translateWithId("captions")}
                selectedId={captionsId}
              >
                <MenuItem
                  id="off"
                  labelText={translateWithId("captionsOff")}
                  on:click={() => chooseTrack(null)}
                />
                {#each media.textTracks as track (track.id)}
                  <MenuItem
                    id={track.id}
                    labelText={track.label}
                    on:click={() => chooseTrack(track.id)}
                  />
                {/each}
              </MenuItemRadioGroup>
            </Menu>
          {/if}

          {#if !isAudio && media.canPictureInPicture && !compact}
            <button
              type="button"
              class:bx--media-player__button={true}
              aria-label={translateWithId(
                media.pictureInPicture
                  ? "exitPictureInPicture"
                  : "pictureInPicture",
              )}
              title={translateWithId(
                media.pictureInPicture
                  ? "exitPictureInPicture"
                  : "pictureInPicture",
              )}
              on:click={() => state.togglePictureInPicture()}
            >
              <PictureInPicture size={20} />
            </button>
          {/if}

          {#if shortcuts && !compact}
            <button
              bind:this={helpButton}
              type="button"
              class:bx--media-player__button={true}
              aria-label={translateWithId("shortcuts")}
              aria-haspopup="dialog"
              aria-expanded={helpOpen ? "true" : "false"}
              aria-keyshortcuts={ariaKeyShortcuts("?")}
              title={translateWithId("shortcuts")}
              on:click={() => (helpOpen ? closeHelp() : openHelp())}
            >
              <Keyboard size={20} />
            </button>
          {/if}

          {#if !isAudio && media.canFullscreen}
            <button
              type="button"
              class:bx--media-player__button={true}
              aria-label={translateWithId(
                media.fullscreen ? "exitFullscreen" : "fullscreen",
              )}
              aria-keyshortcuts={ariaKeyShortcuts("f")}
              title={translateWithId(
                media.fullscreen ? "exitFullscreen" : "fullscreen",
              )}
              on:click={() => state.toggleFullscreen()}
            >
              <svelte:component
                this={media.fullscreen ? Minimize : Maximize}
                size={20}
              />
            </button>
          {/if}
        </div>
      </slot>
    </div>
  </div>

  {#if helpOpen}
    <div
      role="dialog"
      aria-label={translateWithId("shortcuts")}
      class:bx--media-player__help={true}
    >
      <div class:bx--media-player__help-header={true}>
        <h2 class:bx--media-player__help-title={true}>
          {translateWithId("shortcuts")}
        </h2>
        <button
          bind:this={helpClose}
          type="button"
          class:bx--media-player__button={true}
          aria-label={translateWithId("close")}
          title={translateWithId("close")}
          on:click={closeHelp}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="currentColor"
            width="20"
            height="20"
            aria-hidden="true"
            ><path
              d="M24 9.4 22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z"
            ></path></svg
          >
        </button>
      </div>
      <dl class:bx--media-player__help-list={true}>
        {#each MEDIA_SHORTCUTS as item (item.id)}
          <dt>
            {translateWithId(/** @type {MediaPlayerTranslationId} */ (item.id))}
          </dt>
          <dd>
            {#each Array.isArray(item.shortcut) ? item.shortcut : [item.shortcut] as key (key)}
              <Kbd shortcut={key} size="sm" />
            {/each}
          </dd>
        {/each}
      </dl>
    </div>
  {/if}

  <div
    class:bx--visually-hidden={true}
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    {announcement}
  </div>
</div>
