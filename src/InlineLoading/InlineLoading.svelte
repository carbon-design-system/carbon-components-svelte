<script>
  /**
   * Set the loading status
   * @type {"active" | "inactive" | "finished" | "error"}
   */
  export let status = "active";

  /**
   * Set the loading description
   * @type {string}
   */
  export let description = undefined;

  /**
   * Specify a description for the loading icon.
   * Defaults to the `status` prop for the "error" and "finished" states
   * @type {string}
   */
  export let iconDescription = undefined;

  /** Specify the timeout delay (ms) after `status` is set to "success" */
  export let successDelay = 1500;

  import { createEventDispatcher, afterUpdate, onMount } from "svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import Loading from "../Loading/Loading.svelte";

  const dispatch = createEventDispatcher();

  let timeout = undefined;

  onMount(() => {
    return () => {
      clearTimeout(timeout);
    };
  });

  afterUpdate(() => {
    if (status === "finished") {
      timeout = setTimeout(() => {
        dispatch("success");
      }, successDelay);
    }
  });
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class:bx--inline-loading="{true}"
  aria-live="assertive"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--inline-loading__animation="{true}">
    {#if status === "error"}
      <ErrorFilled
        class="bx--inline-loading--error"
        title="{iconDescription || status}"
      />
    {:else if status === "finished"}
      <CheckmarkFilled
        class="bx--inline-loading__checkmark-container"
        title="{iconDescription || status}"
      />
    {:else if status === "inactive" || status === "active"}
      <Loading
        small
        description="{iconDescription}"
        withOverlay="{false}"
        active="{status === 'active'}"
      />
    {/if}
  </div>
  {#if description}
    <div class:bx--inline-loading__text="{true}">{description}</div>
  {/if}
</div>
