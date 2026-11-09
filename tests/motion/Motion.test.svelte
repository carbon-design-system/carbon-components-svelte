<script lang="ts">
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";
  import Motion from "carbon-components-svelte/motion/Motion.svelte";
  import type { ComponentProps } from "svelte";

  export let outer: ComponentProps<Motion> = {};
  export let inner: ComponentProps<Motion> = {};
  export let transition: ComponentProps<Loading>["transition"] = undefined;
  export let nested = false;
  export let show = true;
</script>

<Motion {...outer}>
  {#if nested}
    <Motion {...inner}>
      {#if show}
        <Loading {transition} description="Saving" data-testid="target" />
      {/if}
    </Motion>
  {:else if show}
    <Loading {transition} description="Saving" data-testid="target" />
  {/if}
</Motion>
