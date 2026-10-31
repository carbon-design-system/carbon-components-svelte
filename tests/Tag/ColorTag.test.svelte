<script lang="ts">
  import ColorTag from "carbon-components-svelte/Tag/ColorTag.svelte";
  import type { ComponentProps } from "svelte";

  export let label = "Platform";
  export let onClose = () => {};
  export let onClick = () => {};
  // Everything else goes to the component under test.
  let props: ComponentProps<ColorTag>;
  $: props = $$restProps;
</script>

<ColorTag {...props} on:close={() => onClose()} on:click={() => onClick()}>
  {label}
</ColorTag>
