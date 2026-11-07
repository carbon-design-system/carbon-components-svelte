<script lang="ts">
  import { Box } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let fill: ComponentProps<Box>["fill"] = "layer-01";
</script>

<Box {fill} padding={0} class="doc-code-box">
  <slot />
</Box>
