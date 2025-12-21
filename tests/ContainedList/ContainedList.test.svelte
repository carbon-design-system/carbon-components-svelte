<script lang="ts">
  import {
    Button,
    ContainedList,
    ContainedListItem,
    Search,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Close from "carbon-icons-svelte/lib/Close.svelte";
  import type { ComponentProps } from "svelte";

  export let kind: ComponentProps<ContainedList>["kind"] = "on-page";
  export let labelText: ComponentProps<ContainedList>["labelText"] =
    "List title";
  export let size: ComponentProps<ContainedList>["size"] = "md";
  export let inset: ComponentProps<ContainedList>["inset"] = false;
  export let id: ComponentProps<ContainedList>["id"] = undefined;
  export let interactive: ComponentProps<ContainedListItem>["interactive"] = false;
  export let disabled: ComponentProps<ContainedListItem>["disabled"] = false;
  export let showIcon = false;
  export let showAction = false;
  export let showSearch = false;
</script>

<ContainedList {kind} {labelText} {size} {inset} {id}>
  {#if showSearch}
    <Search slot="action" expandable />
  {/if}
  {#if showAction}
    <Button slot="action" kind="ghost" icon={Close} iconDescription="Action" />
  {/if}
  <ContainedListItem
    {interactive}
    {disabled}
    icon={showIcon ? Add : undefined}
    on:click={() => console.log("click")}
  >
    Item 1
  </ContainedListItem>
  <ContainedListItem {interactive} {disabled} icon={showIcon ? Add : undefined}>
    Item 2
  </ContainedListItem>
  <ContainedListItem {interactive} {disabled} icon={showIcon ? Add : undefined}>
    Item 3
  </ContainedListItem>
</ContainedList>

