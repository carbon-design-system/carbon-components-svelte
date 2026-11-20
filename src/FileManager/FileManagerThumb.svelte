<script>
  /**
   * The picture on a grid tile: the image when it has a URL, else the icon.
   * Mounted only for the tiles in the window, so a folder of thousands asks
   * for the few it shows.
   */

  /** @type {import("./file-manager-types.js").FileRow} */
  export let entry;

  /** @type {(entry: import("./file-manager-types.js").FileRow) => string | Promise<string> | undefined} */
  export let resolveUrl;

  /** @type {any} */
  export let icon;

  import { onMount } from "svelte";
  import { isImage } from "./file-kind.js";

  /** @type {string | undefined} */
  let src;
  let failed = false;
  let mounted = false;

  /**
   * @param {typeof entry} next
   */
  async function load(next) {
    src = undefined;
    failed = false;
    if (!isImage(next)) return;
    try {
      const url = await resolveUrl(next);
      if (next === entry) src = url;
    } catch {
      if (next === entry) failed = true;
    }
  }

  onMount(() => {
    mounted = true;
  });

  $: if (mounted) load(entry);
</script>

{#if src && !failed}
  <img
    {src}
    alt=""
    loading="lazy"
    decoding="async"
    draggable="false"
    class:bx--file-manager__thumb={true}
    on:error={() => (failed = true)}
  />
{:else}
  <span class:bx--file-manager__thumb-icon={true}>
    <svelte:component this={icon} size={32} />
  </span>
{/if}
