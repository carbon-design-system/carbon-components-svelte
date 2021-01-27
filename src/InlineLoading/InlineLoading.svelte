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
   * Specify the ARIA label for the loading icon
   * @type {string}
   */
  export let iconDescription = undefined;

  /** Specify the timeout delay (ms) after `status` is set to "success" */
  export let successDelay = 1500;

  import { createEventDispatcher, afterUpdate, onMount } from "svelte";
  import CheckmarkFilled16 from "carbon-icons-svelte/lib/CheckmarkFilled16/CheckmarkFilled16.svelte";
  import Error20 from "carbon-icons-svelte/lib/Error20/Error20.svelte";
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
      <Error20 class="bx--inline-loading--error" />
    {:else if status === "finished"}
      <CheckmarkFilled16 class="bx--inline-loading__checkmark-container" />
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
