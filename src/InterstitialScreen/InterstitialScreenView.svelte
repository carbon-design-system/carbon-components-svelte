<script>
  /** Specify the step's label, shown in the header's progress indicator when there is more than one view */
  export let stepTitle = "";

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import { uniqueId } from "../utils/unique-id.js";

  const id = uniqueId();
  const ctx = getContext("carbon:InterstitialScreen");
  const views = ctx?.views ?? readable([]);
  const progStep = ctx?.progStep ?? readable(0);

  /** @type {HTMLElement | undefined} */
  let node;

  // `node` binds after the first registration; re-registering with it lets a
  // view inserted after mount take its DOM position in the step order.
  $: ctx?.addView({ id, stepTitle, node });

  // Views register in document order as they initialize, so the server's
  // markup and the first client paint already show only the current step.
  // After mount this is the same `hidden` the body's carousel sets, so a
  // re-render never undoes it.
  $: index = $views.findIndex((view) => view.id === id);
  $: hidden = $views.length > 1 && index !== $progStep;

  onMount(() => {
    return () => {
      ctx?.removeView(id);
    };
  });
</script>

<div
  bind:this={node}
  class:bx--interstitial-screen-view={true}
  hidden={hidden || undefined}
  {...$$restProps}
>
  <slot />
</div>
