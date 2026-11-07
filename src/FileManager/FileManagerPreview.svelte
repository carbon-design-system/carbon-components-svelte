<script>
  /**
   * A preview of one file: an image, a PDF or text in a frame, or a message
   * when there is nothing to show. Internal.
   */

  /** @type {import("./file-manager-types.js").FileRow} */
  export let entry;

  /** @type {(entry: import("./file-manager-types.js").FileRow) => string | Promise<string> | undefined} */
  export let resolveUrl;

  /** @type {import("./texts.js").FileManagerTexts} */
  export let texts;

  /** Set to `"large"` for the full-size preview in a dialog. */
  export let size = "small";

  import { isImage, isPdf, isText } from "./file-kind.js";

  /** @type {string | undefined} */
  let url;
  let failed = false;
  let loading = false;

  // `javascript:` and similar never reach an `src` or `data`.
  const SAFE_URL =
    /^(?:https?:|blob:|data:(?:image|text|application\/pdf)\/|\/|\.\/|\.\.\/|[^:]*$)/i;

  /** @param {typeof entry} next */
  async function load(next) {
    url = undefined;
    failed = false;
    if (!(isImage(next) || isPdf(next) || isText(next))) return;
    loading = true;
    try {
      const resolved = await resolveUrl(next);
      if (next !== entry) return;
      if (resolved && SAFE_URL.test(resolved)) url = resolved;
      else failed = true;
    } catch {
      if (next === entry) failed = true;
    } finally {
      if (next === entry) loading = false;
    }
  }

  $: load(entry);
  $: image = isImage(entry);
  $: pdf = isPdf(entry);
  $: text = isText(entry);
</script>

<div
  class:bx--file-manager__preview={true}
  class:bx--file-manager__preview--large={size === "large"}
>
  {#if url && image}
    <img
      src={url}
      alt={texts.previewLabel(entry.name)}
      class:bx--file-manager__preview-image={true}
      on:error={() => (failed = true)}
    />
  {:else if url && pdf}
    <object
      data={url}
      type="application/pdf"
      aria-label={texts.previewLabel(entry.name)}
      class:bx--file-manager__preview-frame={true}
    >
      <p class:bx--file-manager__preview-fallback={true}>
        {texts.previewUnavailable}
        <a href={url} target="_blank" rel="noopener noreferrer"
          >{texts.openFile}</a
        >
      </p>
    </object>
  {:else if url && text}
    <iframe
      src={url}
      sandbox=""
      title={texts.previewLabel(entry.name)}
      class:bx--file-manager__preview-frame={true}
    ></iframe>
  {:else if failed}
    <p class:bx--file-manager__preview-fallback={true}>
      {texts.previewLoadFailed}
    </p>
  {:else if !loading}
    <p class:bx--file-manager__preview-fallback={true}>
      {texts.previewUnavailable}
    </p>
  {/if}
</div>
