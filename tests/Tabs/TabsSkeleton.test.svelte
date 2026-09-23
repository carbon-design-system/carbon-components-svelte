<script lang="ts">
  import TabsSkeleton from "carbon-components-svelte/Tabs/TabsSkeleton.svelte";
  import type { ComponentProps } from "svelte";

  export let count = 4;
  export let type: ComponentProps<TabsSkeleton>["type"] = "default";
  export let size: ComponentProps<TabsSkeleton>["size"] = undefined;
</script>

<TabsSkeleton {count} {type} {size} />
