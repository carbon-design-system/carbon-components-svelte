<script>
  /**
   * @deprecated
   * This component will be removed in version 1.0.0.
   * Use icons from "carbon-icons-svelte" instead
   */

  /**
   * @extends {"./IconSkeleton.svelte"} IconSkeletonProps
   * @restProps {svg}
   */

  /**
   * Specify the icon to render
   * @type {typeof import("svelte").SvelteComponent}
   */
  export let render = undefined;

  /** Set to `true` to display the skeleton state */
  export let skeleton = false;

  import IconSkeleton from "./IconSkeleton.svelte";
</script>

{#if skeleton}
  <IconSkeleton
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{:else}
  <svelte:component
    this="{render}"
    {...$$restProps}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave
  />
{/if}
