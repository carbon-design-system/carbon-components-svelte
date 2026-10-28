<script lang="ts">
  import ActionBar from "carbon-components-svelte/ActionBar/ActionBar.svelte";
  import ActionBarButton from "carbon-components-svelte/ActionBar/ActionBarButton.svelte";
  import ActionBarDivider from "carbon-components-svelte/ActionBar/ActionBarDivider.svelte";
  import ActionBarGroup from "carbon-components-svelte/ActionBar/ActionBarGroup.svelte";
  import Add from "carbon-components-svelte/icons/Add.svelte";

  /** Which component gets the rest props. */
  export let under: "bar" | "group" | "button" | "divider" = "bar";
  export let iconOnly = false;
</script>

<ActionBar labelText="Formatting" {...under === "bar" ? $$restProps : {}}>
  <ActionBarGroup labelText="History" {...under === "group" ? $$restProps : {}}>
    {#if iconOnly}
      <ActionBarButton
        labelText="Add"
        icon={Add}
        {...under === "button" ? $$restProps : {}}
      />
    {:else}
      <ActionBarButton
        labelText="Bold"
        {...under === "button" ? $$restProps : {}}
      />
    {/if}
  </ActionBarGroup>
  <ActionBarDivider {...under === "divider" ? $$restProps : {}} />
  <ActionBarButton labelText="Italic" />
</ActionBar>
