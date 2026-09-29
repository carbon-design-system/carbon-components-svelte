<script lang="ts">
  import TabsVerticalSkeleton from "carbon-components-svelte/Tabs/TabsVerticalSkeleton.svelte";

  import type { ComponentProps } from "svelte";

  export let count = 4;
  export let orientation: ComponentProps<TabsVerticalSkeleton>["orientation"] =
    undefined;
</script>

<TabsVerticalSkeleton {count} {orientation} />
