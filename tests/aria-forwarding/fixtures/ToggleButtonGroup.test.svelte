<script lang="ts">
  import ToggleButton from "carbon-components-svelte/ToggleButtonGroup/ToggleButton.svelte";
  import ToggleButtonGroup from "carbon-components-svelte/ToggleButtonGroup/ToggleButtonGroup.svelte";
  import Add from "carbon-components-svelte/icons/Add.svelte";

  /** Which component gets the rest props. */
  export let under: "group" | "button" = "group";
  export let iconOnly = false;
</script>

<ToggleButtonGroup
  labelText="Formatting"
  {...under === "group" ? $$restProps : {}}
>
  {#if iconOnly}
    <ToggleButton
      icon={Add}
      iconDescription="Add"
      {...under === "button" ? $$restProps : {}}
    />
  {:else}
    <ToggleButton {...under === "button" ? $$restProps : {}}>Bold</ToggleButton>
  {/if}
  <ToggleButton>Italic</ToggleButton>
</ToggleButtonGroup>
