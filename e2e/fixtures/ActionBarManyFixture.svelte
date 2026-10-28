<script>
  import {
    ActionBar,
    ActionBarButton,
    ActionBarDivider,
    ActionBarGroup,
  } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Copy from "carbon-icons-svelte/lib/Copy.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";
  import Save from "carbon-icons-svelte/lib/Save.svelte";
  import Search from "carbon-icons-svelte/lib/Search.svelte";
  import Settings from "carbon-icons-svelte/lib/Settings.svelte";
  import TrashCan from "carbon-icons-svelte/lib/TrashCan.svelte";
  import Undo from "carbon-icons-svelte/lib/Undo.svelte";

  const icons = [Add, Copy, Edit, Save, Search, Settings, TrashCan, Undo];
  // Five groups of eight.
  const groups = Array.from({ length: 5 }, (_, group) =>
    Array.from({ length: 8 }, (_, index) => ({
      id: group * 8 + index,
      icon: icons[index],
    })),
  );
  /** Whether the first button of each group outlasts the rest. */
  export let prioritized = true;
  /** Whether the first group collapses before the rest. */
  export let leadingLow = false;
  let clicks = 0;
</script>

<div id="many" style="width: 1400px">
  <ActionBar labelText="Many tools">
    {#each groups as group, groupIndex}
      {#if groupIndex > 0}<ActionBarDivider />{/if}
      <ActionBarGroup labelText="Group {groupIndex + 1}">
        {#each group as item}
          <ActionBarButton
            labelText="Tool {item.id + 1}"
            icon={item.icon}
            pinned={item.id === 0}
            priority={leadingLow && item.id < 8
              ? -1
              : prioritized && item.id % 8 === 0
                ? 1
                : 0}
            on:click={() => (clicks += 1)}
          />
        {/each}
      </ActionBarGroup>
    {/each}
  </ActionBar>
</div>
<output data-testid="clicks">{clicks}</output>
