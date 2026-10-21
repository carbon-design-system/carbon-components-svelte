<script>
  /** Specify the step's label, shown in the header's progress indicator when there is more than one view */
  export let stepTitle = "";

  import { getContext, onMount } from "svelte";
  import { uniqueId } from "../utils/unique-id.js";

  const id = uniqueId();
  const ctx = getContext("carbon:InterstitialScreen");

  /** @type {HTMLElement | undefined} */
  let node;

  // `node` binds after the first registration; re-registering with it lets a
  // view inserted after mount take its DOM position in the step order.
  $: ctx?.addView({ id, stepTitle, node });

  onMount(() => {
    return () => {
      ctx?.removeView(id);
    };
  });
</script>

<div
  bind:this={node}
  class:bx--interstitial-screen-view={true}
  {...$$restProps}
>
  <slot />
</div>
