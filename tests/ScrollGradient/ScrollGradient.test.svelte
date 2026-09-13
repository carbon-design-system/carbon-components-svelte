<script lang="ts">
  import ScrollGradient from "carbon-components-svelte/ScrollGradient/ScrollGradient.svelte";

  export let color: string | undefined = undefined;
  export let background: string | undefined = undefined;
  export let hideStartGradient = false;
</script>

<ScrollGradient {color} {background} {hideStartGradient}>
  <p>Content</p>
</ScrollGradient>
