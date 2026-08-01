<script>
  /** @extends {"./Link.svelte"} LinkProps */

  /**
   * @event download
   * @event download:error
   * @type {object}
   * @property {unknown} error
   */

  /**
   * Specify the content to download.
   * @type {string | Blob}
   */
  export let data = undefined;

  /** Specify the downloaded file name. */
  export let filename = "download";

  /**
   * Specify the MIME type used to build the `Blob` when `data` is a string.
   * @type {string}
   */
  export let type = undefined;

  /** Set to `true` to disable the link. */
  export let disabled = false;

  /**
   * Override the default download behavior (creates an object URL for
   * `data` and clicks a temporary anchor).
   * @type {(data: string | Blob, filename: string, type: string) => void | Promise<void>}
   */
  export let download = downloadFile;

  import { createEventDispatcher } from "svelte";
  import { downloadFile } from "../utils/downloadFile.js";
  import Link from "./Link.svelte";

  const dispatch = createEventDispatcher();

  async function handleClick(event) {
    event.preventDefault();
    if (disabled) return;

    try {
      if (download === downloadFile ? data !== undefined : true) {
        await download(data, filename, type);
        dispatch("download");
      }
    } catch (error) {
      dispatch("download:error", { error });
    }
  }
</script>

<Link
  href="#"
  {disabled}
  {...$$restProps}
  on:click
  on:click={handleClick}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:focus
  on:blur
  on:keydown
  on:keyup
>
  <slot />
</Link>
