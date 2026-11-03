<script lang="ts">
  import InlineLoading from "carbon-components-svelte/InlineLoading/InlineLoading.svelte";
  import Loading from "carbon-components-svelte/Loading/Loading.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: "overlay" | "bare" | "inline";
  export let show = true;
  export let transition: ComponentProps<Loading>["transition"] = undefined;
  export let onOutroEnd: () => void = () => {};
</script>

{#if show}
  {#if kind === "overlay"}
    <Loading
      {transition}
      description="Saving"
      data-testid="target"
      on:outroend={onOutroEnd}
    />
  {:else if kind === "bare"}
    <Loading
      {transition}
      withOverlay={false}
      description="Saving"
      data-testid="target"
      on:outroend={onOutroEnd}
    />
  {:else}
    <InlineLoading
      {transition}
      description="Saving"
      data-testid="target"
      on:outroend={onOutroEnd}
    />
  {/if}
{/if}
