<script>
  import {
    Button,
    FloatingPortal,
    Stack,
    Tile,
  } from "carbon-components-svelte";

  let anchor = null;
  let container = null;
  let open = false;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;

  const emptyImage = new Image();
  emptyImage.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

  function handleDragStart(e) {
    const rect = anchor.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    startX = x;
    startY = y;
    e.dataTransfer.setDragImage(emptyImage, 0, 0);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  }

  function handleDrag(e) {
    if ((e.clientX !== 0 || e.clientY !== 0) && container) {
      const parentRect = container.getBoundingClientRect();
      if (
        e.clientX >= parentRect.left &&
        e.clientX <= parentRect.right &&
        e.clientY >= parentRect.top &&
        e.clientY <= parentRect.bottom
      ) {
        x = e.clientX - offsetX - parentRect.left;
        y = e.clientY - offsetY - parentRect.top;
      }
    }
  }

  function handleDragEnd() {
    const moved =
      Math.abs(x - startX) > 5 || Math.abs(y - startY) > 5;
    if (!moved) open = !open;
  }
</script>

<Stack gap={4} style="overflow: hidden; border: 1px dashed var(--cds-border-subtle); padding: 1rem">
  <div>This container has hidden overflow.</div>
  <div bind:this={container} style="position: relative; min-height: 200px; min-width: 300px;">
    <div
      bind:this={anchor}
      role="button"
      tabindex="0"
      draggable="true"
      style="position: absolute; left: {x}px; top: {y}px; cursor: move; user-select: none;"
      on:dragstart={handleDragStart}
      on:drag={handleDrag}
      on:dragend={handleDragEnd}
      on:keydown={(e) => e.key === "Enter" && (open = !open)}
      title="Drag to move, click to toggle"
    >
      <Tile>
        <Button on:click={() => (open = !open)}>Toggle floating content</Button>
      </Tile>
    </div>
  </div>
</Stack>

<FloatingPortal {anchor} {open}>
  <Tile>Content</Tile>
</FloatingPortal>
