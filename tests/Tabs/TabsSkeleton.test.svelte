<script lang="ts">
  import { TabsSkeleton } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let count = 4;
  export let type: ComponentProps<TabsSkeleton>["type"] = "default";
</script>

<TabsSkeleton {count} {type} />
