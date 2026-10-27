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

  import Loading from "../Loading/Loading.svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
</script>

<div class:bx--inline-loading__animation={true}>
  {#if status === "error"}
    <ErrorFilled
      class="bx--inline-loading--error"
      title={iconDescription || status}
    />
  {:else if status === "finished"}
    <CheckmarkFilled
      class="bx--inline-loading__checkmark-container"
      title={iconDescription || status}
    />
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
