<script lang="ts">
  import Prose from "carbon-components-svelte/Prose/Prose.svelte";
  import type { ComponentProps } from "svelte";

  export let variant: ComponentProps<Prose>["variant"] = undefined;
  export let maxWidth: ComponentProps<Prose>["maxWidth"] = undefined;
  export let tag: ComponentProps<Prose>["tag"] = undefined;
</script>

<Prose {variant} {maxWidth} {tag}>
  <h2>Overview</h2>
  <p>Body copy</p>
</Prose>
