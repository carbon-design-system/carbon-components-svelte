<script>
  import { ContextMenu, ContextMenuOption } from "carbon-components-svelte";

  const actions = Array.from(
    { length: 30 },
    (_, index) => `Action ${index + 1}`,
  );

  // ContextMenu flips above the cursor when the menu doesn't fit below, but
  // otherwise renders at `maxHeight` regardless of which side has room. Cap
  // the height to whichever side (above or below the cursor) has more space,
  // computed before ContextMenu's own contextmenu handler runs, so the menu
  // always fits without being clipped by the viewport edge.
  function setMaxHeight(event) {
    const spaceAbove = event.clientY;
    const spaceBelow = window.innerHeight - event.clientY;
    document.documentElement.style.setProperty(
      "--docs-context-menu-max-height",
      `${Math.max(spaceAbove, spaceBelow)}px`,
    );
  }
</script>

<svelte:window on:contextmenu={setMaxHeight} />

<ContextMenu maxHeight="var(--docs-context-menu-max-height)">
  {#each actions as action (action)}
    <ContextMenuOption labelText={action} />
  {/each}
</ContextMenu>

<div data-centered>
  <p>Right click anywhere on this page</p>
</div>
