<script lang="ts">
  import { OverflowMenu, OverflowMenuItem } from "carbon-components-svelte";
</script>

<OverflowMenu>
  <OverflowMenuItem text="First" />
  <OverflowMenuItem disabled text="Second (disabled)" />
  <OverflowMenuItem text="Third" />
  <OverflowMenuItem disabled text="Fourth (disabled)" />
</OverflowMenu>
