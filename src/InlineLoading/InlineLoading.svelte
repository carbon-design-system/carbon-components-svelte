<script>
  // @ts-check

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
   * Defaults to the `status` value for the
   *  "error" and "finished" states.
   * @type {string}
   */
  export let iconDescription = undefined;

  /**
   * Specify the timeout delay (ms) after `status` is set to "finished".
   * The `on:success` event will be dispatched after this delay.
  */
  export let successDelay = 1500;

  import { createEventDispatcher, onMount } from "svelte";
  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import Loading from "../Loading/Loading.svelte";

  /** @type {import("svelte").EventDispatcher<{ success: null }>} */
  const dispatch = createEventDispatcher();

  /** @type {NodeJS.Timeout} */
  let timeout = undefined;

  onMount(() => {
    return () => {
      clearTimeout(timeout);
    };
  });

  $: if (status === "finished") {
    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      dispatch("success");
    }, successDelay);
  }
</script>

<div class:bx--inline-loading="{true}" aria-live="assertive" {...$$restProps}>
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
