<script>
  /**
   * Internal. The icon and description of an `InlineLoading`, shared by its
   * animated and plain roots.
   */

  /**
   * @type {"active" | "inactive" | "finished" | "error"}
   */
  export let status = "active";

  /** @type {string | undefined} */
  export let description = undefined;

  /** @type {string | undefined} */
  export let iconDescription = undefined;

  /** Set to `true` to draw the checkmark when the status turns finished. */
  export let drawCheck = false;

  import Loading from "../Loading/Loading.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
</script>

<div class:bx--inline-loading__animation={true}>
  {#if status === "error"}
    <ErrorFilled
      class="bx--inline-loading--error"
      title={iconDescription || status}
    />
  {:else if status === "finished"}
    <svg
      class="bx--inline-loading__checkmark-container"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="16"
      height="16"
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      <title>{iconDescription || status}</title>
      <circle cx="16" cy="16" r="14"></circle>
      <polyline
        class:bx--inline-loading__checkmark={true}
        class:bx--inline-loading__checkmark--draw={drawCheck}
        points="9.8 15.8 14 20 22.2 11.8"
      ></polyline>
    </svg>
  {:else if status === "inactive" || status === "active"}
    <Loading
      small
      description={iconDescription}
      withOverlay={false}
      active={status === "active"}
    />
  {/if}
</div>
{#if description}
  <div class:bx--inline-loading__text={true}>{description}</div>
{/if}
