<script>
  import {
    ContextMenu,
    ContextMenuOption,
    MenuButton,
    MenuItem,
  } from "carbon-components-svelte";

  // ?kind=menu|context picks the component. ?edge opens it near the inline
  // end of the window, so the submenu flips to the other side. ?rtl sets
  // `dir="rtl"`. ?siblings=sub gives every sibling a submenu of its own.
  const params = new URLSearchParams(location.search);
  const kind = params.get("kind") ?? "menu";
  const edge = params.has("edge");
  const subSiblings = params.get("siblings") === "sub";
  if (params.has("rtl")) document.documentElement.dir = "rtl";

  const siblings = ["Sibling 1", "Sibling 2", "Sibling 3", "Sibling 4"];
  const leaves = Array.from({ length: 8 }, (_, i) => `Leaf ${i + 1}`);
  // Distance from the inline start of the window.
  const inset = edge ? window.innerWidth - 240 : 200;
  const x = params.has("rtl") ? window.innerWidth - inset - 200 : inset;

  let clicked = "";
</script>

{#if kind === "menu"}
  <div style="position: absolute; top: 100px; inset-inline-start: {inset}px">
    <MenuButton labelText="Actions" open>
      <MenuItem labelText="Share">
        {#each leaves as leaf}
          <MenuItem on:click={() => (clicked = leaf)}>{leaf}</MenuItem>
        {/each}
      </MenuItem>
      {#each siblings as sibling}
        {#if subSiblings}
          <MenuItem labelText={sibling}>
            <MenuItem>{sibling} child</MenuItem>
          </MenuItem>
        {:else}
          <MenuItem>{sibling}</MenuItem>
        {/if}
      {/each}
    </MenuButton>
  </div>
{:else}
  <ContextMenu open {x} y={140}>
    <ContextMenuOption labelText="Share">
      {#each leaves as leaf}
        <ContextMenuOption labelText={leaf} on:click={() => (clicked = leaf)} />
      {/each}
    </ContextMenuOption>
    {#each siblings as sibling}
      {#if subSiblings}
        <ContextMenuOption labelText={sibling}>
          <ContextMenuOption labelText="{sibling} child" />
        </ContextMenuOption>
      {:else}
        <ContextMenuOption labelText={sibling} />
      {/if}
    {/each}
  </ContextMenu>
{/if}

<p data-testid="clicked">{clicked}</p>
