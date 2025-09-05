<script lang="ts">
  import { TabsSkeleton } from "carbon-components-svelte";

  export let count = 4;
  export let type: "default" | "container" = "default";
</script>

<TabsSkeleton {count} {type} />
