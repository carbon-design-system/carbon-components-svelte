<script>
  /** Specify the step's label, shown in the header's progress indicator when there is more than one view */
  export let stepTitle = "";

  import { getContext, onMount } from "svelte";
  import { uniqueId } from "../utils/uniqueId.js";

  const id = uniqueId();
  const ctx = getContext("carbon:InterstitialScreen");

  $: ctx?.addView({ id, stepTitle });

  onMount(() => {
    return () => {
      ctx?.removeView(id);
    };
  });
</script>

<div class:bx--interstitial-screen-view={true} {...$$restProps}>
  <slot />
</div>
