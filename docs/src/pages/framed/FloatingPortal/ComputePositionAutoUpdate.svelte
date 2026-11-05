<script>
  import {
    autoUpdate,
    Button,
    computePosition,
    Stack,
    Tag,
  } from "carbon-components-svelte";
  import { onMount } from "svelte";

  let anchor = null;
  let floating = null;
  let placement = "bottom";
  let preferred = "bottom-start";

  // Measure in the first step, write in the second: with many overlays open,
  // every one reads before any writes, so layout happens once.
  function update() {
    if (!(anchor && floating)) return;
    const rect = anchor.getBoundingClientRect();
    const size = floating.getBoundingClientRect();
    const result = computePosition(rect, size, {
      placement: preferred,
      offset: 8,
      rtl: getComputedStyle(anchor).direction === "rtl",
      flip: { align: true },
      shift: { padding: 8 },
      boundary: {
        left: 0,
        top: 0,
        right: document.documentElement.clientWidth,
        bottom: document.documentElement.clientHeight,
      },
    });
    return () => {
      placement = result.placement;
      floating.style.left = `${result.x}px`;
      floating.style.top = `${result.y}px`;
    };
  }

  onMount(() => autoUpdate(anchor, floating, update));
  $: if (preferred) update()?.();
</script>

<Stack gap={5}>
  <p>
    A box placed with <code>computePosition</code> and kept there by
    <code>autoUpdate</code>. Scroll the page or resize the window and it stays
    on the button.
  </p>

  <Stack orientation="horizontal" gap={3} align="center">
    <span bind:this={anchor}>
      <Button>Anchor</Button>
    </span>
    <Button
      kind="tertiary"
      on:click={() =>
        (preferred = preferred === "bottom-start" ? "top-end" : "bottom-start")}
    >
      Prefer {preferred === "bottom-start" ? "top-end" : "bottom-start"}
    </Button>
    <Tag>{placement}</Tag>
  </Stack>
</Stack>

<div bind:this={floating} class="floating">
  <Tag type="blue">Floating</Tag>
</div>

<style>
  .floating {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
  }
</style>
