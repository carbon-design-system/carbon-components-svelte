<script lang="ts">
  import Prose from "carbon-components-svelte/Prose/Prose.svelte";
  import type { ComponentProps } from "svelte";

  export let variant: ComponentProps<Prose>["variant"] = undefined;
  export let maxWidth: ComponentProps<Prose>["maxWidth"] = undefined;
  export let tag: ComponentProps<Prose>["tag"] = undefined;
  export let ref: ComponentProps<Prose>["ref"] = null;
  export let linkTone: ComponentProps<Prose>["linkTone"] = undefined;
</script>

<Prose
  data-testid="prose"
  class="custom"
  {variant}
  {maxWidth}
  {tag}
  {linkTone}
  bind:ref
>
  <h2>Overview</h2>
  <p>Body copy</p>
</Prose>
