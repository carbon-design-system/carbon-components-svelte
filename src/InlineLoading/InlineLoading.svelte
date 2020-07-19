<script>
  export let status = "active"; // "active" | "inactive" | "finished" | "error"
  export let description = undefined;
  export let iconDescription = undefined;
  export let successDelay = 1500;

  import { createEventDispatcher, afterUpdate, onDestroy } from "svelte";
  import CheckmarkFilled16 from "carbon-icons-svelte/lib/CheckmarkFilled16";
  import Error20 from "carbon-icons-svelte/lib/Error20";
  import { Loading } from "../Loading";

  const dispatch = createEventDispatcher();

  $: timeoutId = undefined;

  afterUpdate(() => {
    if (status === "finished") {
      timeoutId = window.setTimeout(() => {
        dispatch("success");
      }, successDelay);
    }
  });

  onDestroy(() => {
    window.clearTimeout(timeoutId);
    timeoutId = undefined;
  });
</script>

<div
  aria-live="assertive"
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <div class:bx--inline-loading__animation={true}>
    {#if status === 'error'}
      <Error20 class="bx--inline-loading--error" />
    {:else if status === 'finished'}
      <CheckmarkFilled16 class="bx--inline-loading__checkmark-container" />
    {:else if status === 'inactive' || status === 'active'}
      <Loading
        small
        description={iconDescription}
        withOverlay={false}
        active={status === 'active'} />
    {/if}
  </div>
  {#if description}
    <div class:bx--inline-loading__text={true}>{description}</div>
  {/if}
</div>
