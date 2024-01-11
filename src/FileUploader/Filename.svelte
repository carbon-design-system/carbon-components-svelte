<script>
  /**
   * @restProps {div | button | svg}
   */

  /**
   * Specify the file name status
   * @type {"uploading" | "edit" | "complete"}
   */
  export let status = "uploading";

  /** Specify the ARIA label used for the status icons */
  export let iconDescription = "";

  /** Set to `true` to indicate an invalid state */
  export let invalid = false;

  import Close from "../icons/Close.svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";
  import Loading from "../Loading/Loading.svelte";
</script>

{#if status === "uploading"}
  <Loading
    description="{iconDescription}"
    {...$$restProps}
    small
    withOverlay="{false}"
  />
{/if}

{#if status === "edit"}
  {#if invalid}
    <WarningFilled class="bx--file-invalid" />
  {/if}
  <button
    aria-label="{iconDescription}"
    class:bx--file-close="{true}"
    type="button"
    tabindex="0"
    {...$$restProps}
    on:click
    on:keydown
  >
    <Close />
  </button>
{/if}

{#if status === "complete"}
  <CheckmarkFilled
    aria-label="{iconDescription}"
    title="{iconDescription}"
    class="bx--file-complete"
    {...$$restProps}
  />
{/if}
