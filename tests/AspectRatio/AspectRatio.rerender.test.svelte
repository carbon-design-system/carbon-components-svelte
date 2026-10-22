<script lang="ts">
  import AspectRatio from "carbon-components-svelte/AspectRatio/AspectRatio.svelte";
  import type { ComponentProps } from "svelte";

  export let ratio: ComponentProps<AspectRatio>["ratio"] = "2x1";
</script>

<AspectRatio {ratio} data-testid="ratio">Content</AspectRatio>
