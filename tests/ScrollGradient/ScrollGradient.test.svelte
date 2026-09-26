<script lang="ts">
  import ScrollGradient from "carbon-components-svelte/ScrollGradient/ScrollGradient.svelte";

  export let color: string | undefined = undefined;
  export let background: string | undefined = undefined;
  export let height: string | undefined = undefined;
  export let hideStartGradient = false;
  export let className: string | undefined = undefined;
</script>

<ScrollGradient
  {color}
  {background}
  {height}
  {hideStartGradient}
  class={className}
>
  <p>Content</p>
</ScrollGradient>
