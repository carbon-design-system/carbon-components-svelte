<script>
  /**
   * @restProps {section}
   * @event {{ renderer: string | undefined; name: string; mime: string; size: number | undefined; truncated: boolean }} load
   * @event {{ reason: "unsupported" | "too-large" | "failed" | "unreadable"; error?: unknown }} load:error
   */

  /**
   * Specify a `File` or `Blob` to preview. Its bytes are read in the
   * browser; nothing is uploaded. A `File` names itself and gives its own
   * type; set `name` and `type` for a bare `Blob`.
   * @type {File | Blob | undefined}
   */
  export let file = undefined;

  /**
   * Specify a URL to fetch and preview. The server must allow the fetch
   * (CORS), or the preview falls back to the file card; audio and video
   * still play from a URL the page cannot fetch. Only `http`, `https`,
   * `blob` and `data` URLs load. `file` and `text` take precedence.
   * @type {string | undefined}
   */
  export let src = undefined;

  /**
   * Specify text to preview. It is shown as text, never as HTML. Set `name`
   * or `type` to say what kind of text it is (`notes.md`, `text/csv`).
   * @type {string | undefined}
   */
  export let text = undefined;

  /**
   * Specify the file name. It defaults to the `File`'s name or the last
   * segment of `src`, and it picks the renderer when the type is generic.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify the MIME type. It defaults to the `File`'s type or the
   * response's `Content-Type`, and it wins over the extension, except where
   * it is generic (`application/octet-stream`).
   * @type {string | undefined}
   */
  export let type = undefined;

  /**
   * Specify renderers to try before the built-in ones. Each is
   * `{ match(mime, name), component | load, maxBytes?, partial?, id? }`;
   * the first whose `match` returns `true` and that accepts the file's size
   * shows it. A renderer with the `id` of a built-in (`"image"`, `"pdf"`,
   * `"video"`, `"audio"`, `"markdown"`, `"json"`, `"csv"`, `"text"`)
   * replaces that built-in. A renderer component takes `file` and
   * `options`, and dispatches `ready`, or `fallback` with `{ reason }`.
   * @type {ReadonlyArray<import("./file-preview.js").FilePreviewRenderer> | undefined}
   */
  export let renderers = undefined;

  /**
   * Color source with a tokenizer, such as `tokenize` from
   * `carbon-components-svelte/syntax`: it takes the code and a language
   * and returns tokens, or `undefined` for a language it does not know.
   * Load `css/syntax.css` and `css/syntax-tokens.css` for the colors.
   * Without it, source is plain. Core does not import `syntax`, so apps
   * that never preview code do not load it.
   * @type {((code: string, language: string) => ReadonlyArray<{ type: string | null; text: string }> | undefined) | undefined}
   */
  export let highlight = undefined;

  /**
   * Specify the height of the preview area as a CSS length. Text and
   * tables are as tall as their content, up to this height, and scroll
   * past it. Images, PDFs and video fill it. In full screen it is the
   * screen's height. Unset, it is 24rem, or the `--ccs-file-preview-height`
   * the page sets.
   * @type {string | undefined}
   */
  export let height = undefined;

  /**
   * Set to `true` while the preview fills the screen. Use the button, or
   * `bind:fullscreen` to follow it; the browser's Fullscreen API needs a
   * click to enter, so setting it to `true` from code does nothing.
   * @bindable readonly
   */
  export let fullscreen = false;

  /**
   * Set to `false` to leave out the full screen button. It is also left out
   * where the browser has no Fullscreen API (iPhone).
   */
  export let fullscreenable = true;

  /**
   * Set to `true` to hide the header with the file name, type, size and
   * actions. The region keeps the file name as its label, and the file
   * card shows the name itself.
   */
  export let hideHeader = false;

  /**
   * Specify the locale for sizes and counts, such as "de-DE".
   * @type {string | undefined}
   */
  export let locale = undefined;

  /**
   * Specify options for the `fetch` of `src`, such as `headers` or
   * `credentials`. The preview's own `signal` replaces any `signal` here.
   * @type {RequestInit | undefined}
   */
  export let requestInit = undefined;

  /**
   * Specify an id, which the file name and live region derive theirs from.
   * @type {string | undefined}
   */
  export let id = undefined;

  /** Specify the label of the download button and card link */
  export let downloadText = "Download";

  /** Specify the label of the button that enters full screen */
  export let fullscreenText = "Full screen";

  /** Specify the label of the button that leaves full screen */
  export let exitFullscreenText = "Exit full screen";

  /** Specify the label of the image zoom-in button */
  export let zoomInText = "Zoom in";

  /** Specify the label of the image zoom-out button */
  export let zoomOutText = "Zoom out";

  /** Specify the label of the button that fits an image to the box */
  export let zoomFitText = "Fit to screen";

  /** Specify the label of the button that shows more of a long file */
  export let showMoreText = "Show more";

  /** Specify the text screen readers hear while the preview loads */
  export let loadingDescription = "Loading preview";

  /**
   * Specify why there is no preview. `reason` is `"unsupported"` (no
   * renderer, or the content is not what its type says), `"too-large"`,
   * `"failed"` (the fetch failed, often CORS) or `"unreadable"` (the
   * browser could not decode it).
   * @type {(reason: "unsupported" | "too-large" | "failed" | "unreadable") => string}
   */
  export let fallbackText = defaultFallbackText;

  /**
   * Specify the note for a file shown in part. `unit` is `"bytes"`,
   * `"lines"` or `"rows"`; `total` is `undefined` when unknown.
   * @type {(shown: number, total: number | undefined, unit: "bytes" | "lines" | "rows", locale: string | undefined) => string}
   */
  export let truncatedText = defaultTruncatedText;

  /**
   * Specify the note for text that was not UTF-8, such as "Read as
   * windows-1252".
   * @type {(encoding: string) => string}
   */
  export let encodingText = defaultEncodingText;

  /**
   * Obtain a reference to the root element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  /** @param {"unsupported" | "too-large" | "failed" | "unreadable"} reason */
  function defaultFallbackText(reason) {
    if (reason === "too-large") return "This file is too large to preview.";
    if (reason === "failed") return "This file could not be loaded.";
    if (reason === "unreadable") return "This file could not be displayed.";
    return "No preview is available for this file type.";
  }

  /**
   * @param {number} shown
   * @param {number | undefined} total
   * @param {"bytes" | "lines" | "rows"} unit
   * @param {string | undefined} locale
   */
  function defaultTruncatedText(shown, total, unit, locale) {
    if (unit === "bytes") {
      const first = formatFileSize(shown, { locale });
      return total === undefined
        ? `Showing the first ${first}.`
        : `Showing the first ${first} of ${formatFileSize(total, { locale })}.`;
    }
    const format = getNumberFormatter(locale).format;
    const noun = unit === "rows" ? "rows" : "lines";
    return total === undefined
      ? `Showing the first ${format(shown)} ${noun}.`
      : `Showing ${format(shown)} of ${format(total)} ${noun}.`;
  }

  /** @param {string} encoding */
  function defaultEncodingText(encoding) {
    return `Read as ${encoding}.`;
  }

  import { createEventDispatcher, onMount } from "svelte";
  import Button from "../Button/Button.svelte";
  import Download from "../icons/Download.svelte";
  import Maximize from "../icons/Maximize.svelte";
  import Minimize from "../icons/Minimize.svelte";
  import { formatFileSize } from "../utils/format-file-size.js";
  import { getNumberFormatter } from "../utils/intl-formatter-cache.js";
  import { uniqueId } from "../utils/unique-id.js";
  import FilePreviewCard from "./FilePreviewCard.svelte";
  import {
    DEFAULT_MAX_BYTES,
    extensionOf,
    mergeRenderers,
    nameFromUrl,
    normalizeMime,
    pickRenderer,
    readCapped,
    safeBlobType,
    safeSource,
    sameRenderers,
  } from "./file-preview.js";

  const HTTP_URL = /^https?:\/\//i;
  const dispatch = createEventDispatcher();
  const fallbackId = uniqueId();

  /** @typedef {"unsupported" | "too-large" | "failed" | "unreadable"} Reason */

  /** @type {"loading" | "ready" | "fallback"} */
  let state = "loading";
  /** @type {Reason} */
  let reason = "unsupported";
  /** @type {import("./file-preview.js").PreviewFile | undefined} */
  let current;
  /** @type {import("./file-preview.js").RendererComponent | undefined} */
  let Renderer;
  /** @type {string | undefined} */
  let rendererId;
  /** @type {string | undefined} */
  let downloadHref;
  /** @type {{ name: string; mime: string; size: number | undefined } | undefined} */
  let resolved;
  let mounted = false;
  let canFullscreen = false;
  let runId = 0;
  /** @type {AbortController | undefined} */
  let controller;
  /** @type {string[]} */
  let objectUrls = [];

  $: baseId = id || fallbackId;

  // What the header can say before anything loads, so the server HTML and
  // the first client render agree.
  $: initialName =
    name ||
    (file && "name" in file ? file.name : "") ||
    (src ? nameFromUrl(src) : "");
  $: initialSize = file
    ? file.size
    : text === undefined
      ? undefined
      : text.length;
  $: initialMime = normalizeMime(type || file?.type);
  $: initialHref = src ? httpLink(src) : undefined;

  $: displayName = resolved?.name ?? initialName;
  $: displayMime = resolved?.mime ?? initialMime;
  $: displaySize = resolved ? resolved.size : initialSize;
  $: typeLabel = labelFor(displayMime, displayName);
  $: meta =
    displaySize === undefined ? "" : formatFileSize(displaySize, { locale });
  $: cardMeta = [typeLabel, meta].filter(Boolean).join(" ");
  $: href = downloadHref ?? initialHref;

  $: ariaLabel =
    $$restProps["aria-label"] ??
    (hideHeader && displayName ? displayName : undefined);
  $: ariaLabelledby =
    $$restProps["aria-labelledby"] ??
    (hideHeader || $$restProps["aria-label"] || !displayName
      ? undefined
      : `${baseId}-name`);

  $: options = {
    texts: {
      zoomIn: zoomInText,
      zoomOut: zoomOutText,
      zoomFit: zoomFitText,
      showMore: showMoreText,
      /**
       * @param {number} shown
       * @param {number | undefined} total
       * @param {"bytes" | "lines" | "rows"} unit
       */
      truncated: (shown, total, unit) =>
        truncatedText(shown, total, unit, locale),
      encoding: encodingText,
    },
    highlight,
    locale,
  };

  // The spinner announces itself, so only the fallback needs this region.
  $: announcement = state === "fallback" ? fallbackText(reason) : "";

  /**
   * @param {string} mime
   * @param {string} fileName
   */
  function labelFor(mime, fileName) {
    const ext = extensionOf(fileName);
    return ext ? ext.toUpperCase() : mime;
  }

  /** @param {string} url */
  function httpLink(url) {
    return HTTP_URL.test(url) ? url : undefined;
  }

  function release() {
    for (const url of objectUrls) URL.revokeObjectURL(url);
    objectUrls = [];
  }

  /**
   * @param {Reason} why
   * @param {unknown} [error]
   */
  function fail(why, error) {
    state = "fallback";
    reason = why;
    dispatch("load:error", { reason: why, error });
  }

  async function run() {
    const mine = ++runId;
    controller?.abort();
    controller =
      typeof AbortController === "undefined"
        ? undefined
        : new AbortController();
    const signal = controller?.signal;
    release();
    state = "loading";
    current = undefined;
    Renderer = undefined;
    rendererId = undefined;
    downloadHref = undefined;
    resolved = undefined;
    /** @type {string[]} */
    const created = [];
    /** @param {Blob} blob */
    const makeUrl = (blob) => {
      const url = URL.createObjectURL(blob);
      created.push(url);
      return url;
    };

    try {
      const all = mergeRenderers(renderers);
      /** @type {Blob | undefined} */
      let source;
      let mime = "";
      let fileName = "";
      /** @type {number | undefined} */
      let size;
      /** @type {Response | undefined} */
      let response;
      /** @type {string | undefined} */
      let remote;

      if (file) {
        source = file;
        mime = normalizeMime(type || file.type);
        fileName = name || ("name" in file ? file.name : "");
        size = file.size;
      } else if (text !== undefined) {
        source = new Blob([text], { type: "text/plain" });
        fileName = name || "";
        mime =
          normalizeMime(type) || (extensionOf(fileName) ? "" : "text/plain");
        size = source.size;
      } else if (src) {
        remote = safeSource(
          src,
          typeof location === "undefined" ? undefined : location.href,
        );
        fileName = name || nameFromUrl(src);
        mime = normalizeMime(type);
        if (!remote) return fail("unsupported");
        try {
          response = await fetch(remote, { ...requestInit, signal });
        } catch (error) {
          if (mine !== runId) return;
          // The page cannot read it (CORS, offline). A media element can
          // still play it, which is not a read.
          const guess = pickRenderer(all, mime, fileName, undefined);
          if (!guess.renderer?.stream) {
            resolved = { name: fileName, mime, size: undefined };
            downloadHref = httpLink(remote);
            return fail("failed", error);
          }
        }
        if (mine !== runId) return;
        if (response) {
          if (!response.ok) {
            resolved = { name: fileName, mime, size: undefined };
            downloadHref = httpLink(remote);
            return fail("failed", new Error(`HTTP ${response.status}`));
          }
          mime = normalizeMime(type || response.headers.get("content-type"));
          const length = Number(response.headers.get("content-length"));
          size = length > 0 ? length : undefined;
        }
      } else {
        return fail("unsupported");
      }

      resolved = { name: fileName, mime, size };
      const picked = pickRenderer(all, mime, fileName, size);
      const renderer = picked.renderer;
      if (source)
        downloadHref = makeUrl(
          new Blob([source], { type: "application/octet-stream" }),
        );
      else downloadHref = remote && httpLink(remote);
      if (!renderer) {
        response?.body?.cancel().catch(() => {});
        return fail(picked.reason ?? "unsupported");
      }

      const cap = renderer.maxBytes ?? DEFAULT_MAX_BYTES;
      /** @type {Blob} */
      let blob;
      let truncated = false;
      /** @type {string} */
      let url;
      if (renderer.stream) {
        // Played from its own URL: never read into memory, so no cap.
        response?.body?.cancel().catch(() => {});
        blob = new Blob();
        url = source ? makeUrl(source) : /** @type {string} */ (remote);
      } else {
        if (source) {
          truncated = source.size > cap;
          blob = truncated ? source.slice(0, cap) : source;
        } else {
          const read = await readCapped(
            /** @type {Response} */ (response),
            cap,
          );
          if (mine !== runId) return;
          blob = read.blob;
          truncated = read.truncated;
          if (truncated && !renderer.partial) return fail("too-large");
          // A cross-origin link ignores `download`, so save from the bytes.
          if (!truncated) {
            downloadHref = makeUrl(
              new Blob([blob], { type: "application/octet-stream" }),
            );
          }
        }
        url = makeUrl(
          new Blob([blob], { type: safeBlobType(mime, renderer.id) }),
        );
      }

      let component = renderer.component;
      if (!component && renderer.load) {
        try {
          component = (await renderer.load()).default;
        } catch (error) {
          if (mine !== runId) return;
          return fail("failed", error);
        }
      }
      if (mine !== runId) return;
      if (!component) return fail("unsupported");

      current = {
        blob,
        url,
        name: fileName,
        mime,
        size: size ?? (truncated ? undefined : blob.size),
        truncated,
      };
      Renderer = component;
      rendererId = renderer.id;
      state = "ready";
    } catch (error) {
      if (mine === runId) fail("failed", error);
    } finally {
      if (mine === runId) objectUrls = created;
      else for (const url of created) URL.revokeObjectURL(url);
    }
  }

  let destroyed = false;

  function start() {
    if (!destroyed) run();
  }

  /** @type {{ file?: unknown; src?: unknown; text?: unknown; type?: unknown; name?: unknown; renderers?: ReadonlyArray<unknown> }} */
  let seen = {};

  // Take the arguments so Svelte 3 and 4 see what the reload depends on.
  /**
   * @param {unknown} nextFile
   * @param {unknown} nextSrc
   * @param {unknown} nextText
   * @param {unknown} nextType
   * @param {unknown} nextName
   * @param {ReadonlyArray<unknown> | undefined} nextRenderers
   */
  function sync(
    nextFile,
    nextSrc,
    nextText,
    nextType,
    nextName,
    nextRenderers,
  ) {
    if (
      nextFile === seen.file &&
      nextSrc === seen.src &&
      nextText === seen.text &&
      nextType === seen.type &&
      nextName === seen.name &&
      sameRenderers(nextRenderers, seen.renderers)
    ) {
      return;
    }
    seen = {
      file: nextFile,
      src: nextSrc,
      text: nextText,
      type: nextType,
      name: nextName,
      renderers: nextRenderers,
    };
    // Svelte 3 and 4 do not run a `$:` again for what another `$:` sets in
    // the same flush, so state `run` sets before its first await would leave
    // `href` and `announcement` stale. Start it after the flush.
    Promise.resolve().then(start);
  }

  $: if (mounted) sync(file, src, text, type, name, renderers);

  /** @param {CustomEvent<{ reason: Reason }>} event */
  function handleFallback(event) {
    if (state !== "ready") return;
    current = undefined;
    Renderer = undefined;
    fail(event.detail?.reason ?? "unsupported");
  }

  function handleReady() {
    if (!current) return;
    dispatch("load", {
      renderer: rendererId,
      name: current.name,
      mime: current.mime,
      size: current.size,
      truncated: current.truncated,
    });
  }

  function toggleFullscreen() {
    if (!ref) return;
    if (document.fullscreenElement === ref) {
      document.exitFullscreen().catch(() => {});
    } else {
      ref.requestFullscreen().catch(() => {});
    }
  }

  function syncFullscreen() {
    fullscreen = document.fullscreenElement === ref;
  }

  onMount(() => {
    canFullscreen = document.fullscreenEnabled === true;
    mounted = true;
    return () => {
      destroyed = true;
      runId++;
      controller?.abort();
      release();
    };
  });
</script>

<svelte:document on:fullscreenchange={syncFullscreen} />

<section
  bind:this={ref}
  id={id || undefined}
  class:bx--file-preview={true}
  class:bx--file-preview--fullscreen={fullscreen}
  aria-busy={state === "loading" ? "true" : undefined}
  {...$$restProps}
  aria-label={ariaLabel}
  aria-labelledby={ariaLabelledby}
>
  {#if !hideHeader}
    <div class:bx--file-preview__header={true}>
      <div class:bx--file-preview__title={true}>
        <span
          id="{baseId}-name"
          class:bx--file-preview__name={true}
          dir="auto"
          title={displayName}>{displayName}</span
        >
        <span class:bx--file-preview__meta={true} dir="ltr">
          {#if typeLabel}<span>{typeLabel}</span>{/if}
          {#if meta}<span>{meta}</span>{/if}
        </span>
      </div>
      <div class:bx--file-preview__actions={true}>
        {#if href && state !== "fallback"}
          <Button
            kind="ghost"
            size="sm"
            icon={Download}
            iconDescription={downloadText}
            tooltipAlign="bottom-end"
            {href}
            download={displayName}
          />
        {/if}
        {#if fullscreenable && canFullscreen && state === "ready"}
          <Button
            kind="ghost"
            size="sm"
            icon={fullscreen ? Minimize : Maximize}
            iconDescription={fullscreen ? exitFullscreenText : fullscreenText}
            tooltipAlign="bottom-end"
            on:click={toggleFullscreen}
          />
        {/if}
      </div>
    </div>
  {/if}
  <div
    class:bx--file-preview__body={true}
    class:bx--file-preview__body--ready={state === "ready"}
    style:--ccs-file-preview-height={height}
  >
    {#if state === "ready" && Renderer && current}
      <svelte:component
        this={Renderer}
        file={current}
        {options}
        on:ready={handleReady}
        on:fallback={handleFallback}
      />
    {:else if state === "fallback"}
      <FilePreviewCard
        identify={hideHeader}
        name={displayName}
        meta={cardMeta}
        message={fallbackText(reason)}
        {href}
        {downloadText}
      />
    {:else}
      <FilePreviewCard
        loading
        identify={hideHeader}
        name={displayName}
        meta={cardMeta}
        {loadingDescription}
      />
    {/if}
  </div>
  <div class="bx--visually-hidden" role="status">{announcement}</div>
</section>
