<script lang="ts">
  import ScrollGradient from "carbon-components-svelte/ScrollGradient/ScrollGradient.svelte";

  export let color: string | undefined = undefined;
  export let background: string | undefined = undefined;
  export let height: string | undefined = undefined;
  export let hideStartGradient = false;
  export let className: string | undefined = undefined;
  export let scrollElementClassName: string | undefined = undefined;
  export let style: string | undefined = undefined;
  export let onScroll: (event: Event) => void = () => {};
</script>

<ScrollGradient
  {color}
  {background}
  {height}
  {hideStartGradient}
  {scrollElementClassName}
  class={className}
  {style}
  on:scroll={onScroll}
>
  <p>Content</p>
</ScrollGradient>
