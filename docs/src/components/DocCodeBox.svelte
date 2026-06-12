<script lang="ts">
  import { Box } from "carbon-components-svelte";

  export let fill = "layer-01";
</script>

<Box {fill} padding={0} class="doc-code-box">
  <slot />
</Box>
