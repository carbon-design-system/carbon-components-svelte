<script lang="ts">
  import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "carbon-components-svelte/ToggleButtonGroup/ToggleButtonGroup.svelte";
  import TextBold from "carbon-icons-svelte/lib/TextBold.svelte";
  import TextItalic from "carbon-icons-svelte/lib/TextItalic.svelte";

  export let onParentKeydown: (event: KeyboardEvent) => void = () => {};
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div on:keydown={onParentKeydown}>
  <ToggleButtonGroup>
    <ToggleButton value="bold" icon={TextBold} iconDescription="Bold" />
    <ToggleButton value="italic" icon={TextItalic} iconDescription="Italic" />
  </ToggleButtonGroup>
  <input aria-label="Other control">
</div>
