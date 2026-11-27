<script>
  /**
   * The card shown while a preview loads and when there is none: the file's
   * name, type and size, why there is no preview, and a download. Not
   * exported.
   */

  /**
   * Set to `true` to show the file's name and type, when no header does.
   */
  export let identify = false;

  /**
   * Specify the file name.
   * @type {string}
   */
  export let name = "";

  /**
   * Specify the type and size line, such as "PDF 1.2 MB".
   * @type {string}
   */
  export let meta = "";

  /**
   * Specify why there is no preview. Leave it unset while loading.
   * @type {string}
   */
  export let message = "";

  /**
   * Specify where the download link goes. Without it there is no link.
   * @type {string | undefined}
   */
  export let href = undefined;

  /**
   * Specify the label of the download link.
   * @type {string}
   */
  export let downloadText = "Download";

  /**
   * Set to `true` while the preview loads: the card shows a spinner
   * instead of the message.
   */
  export let loading = false;

  /**
   * Specify the text that describes the spinner.
   * @type {string}
   */
  export let loadingDescription = "Loading preview";

  import Button from "../Button/Button.svelte";
  import InlineLoading from "../InlineLoading/InlineLoading.svelte";
  import Document from "../icons/Document.svelte";
  import Download from "../icons/Download.svelte";
</script>

<div class:bx--file-preview__card={true}>
  <Document size={32} aria-hidden="true" />
  {#if identify}
    <p class:bx--file-preview__card-name={true} dir="auto">{name}</p>
    {#if meta}
      <p class:bx--file-preview__card-meta={true} dir="ltr">{meta}</p>
    {/if}
  {/if}
  {#if loading}
    <InlineLoading description={loadingDescription} />
  {:else}
    {#if message}
      <p class:bx--file-preview__card-message={true}>{message}</p>
    {/if}
    {#if href}
      <Button kind="ghost" size="sm" icon={Download} {href} download={name}>
        {downloadText}
      </Button>
    {/if}
  {/if}
</div>
