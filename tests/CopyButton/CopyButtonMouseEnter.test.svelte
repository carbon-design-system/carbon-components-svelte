<script lang="ts">
  import { CopyButton } from "carbon-components-svelte";

  export let onMouseEnter = () => {};
</script>

<CopyButton
  text="hover me"
  iconDescription="Hover test"
  on:mouseenter={onMouseEnter}
/>
