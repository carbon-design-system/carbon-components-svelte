<script>
  import {
    Button,
    OperationalTag,
    Popover,
    Toggletip,
  } from "carbon-components-svelte";

  // `?dir=rtl` sets the page direction before anything mounts, since the
  // components read it when they open.
  if (new URLSearchParams(location.search).get("dir") === "rtl") {
    document.documentElement.dir = "rtl";
  }

  let open = {
    edge: false,
    side: false,
    bottom: false,
    scroll: false,
    card: false,
    plain: false,
    narrow: false,
    narrowPortal: false,
  };
  const text = "Replicated to two zones, backed up nightly, kept for 30 days.";
</script>

<!-- At the window's right edge. -->
<div
  style="display: flex; justify-content: flex-end; gap: 1rem; padding: 1rem 0.5rem"
>
  <div data-testid="toggletip-end">
    <Toggletip align="start" iconDescription="Toggletip at the end"
      ><p>{text}</p></Toggletip
    >
  </div>
  <div data-testid="tag-end">
    <OperationalTag align="start"
      >Tag at the end
      <svelte:fragment slot="content"
        ><span style="display: block; width: 16rem">{text}</span
        ></svelte:fragment
      >
    </OperationalTag>
  </div>
  <div data-testid="edge" style="position: relative">
    <Button size="sm" on:click={() => (open.edge = !open.edge)}>Edge</Button>
    <Popover open={open.edge} caret align="bottom-start"
      ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
    >
  </div>
</div>

<div style="display: flex; justify-content: flex-end; padding: 0 0.5rem 1rem">
  <div data-testid="side" style="position: relative">
    <Button size="sm" on:click={() => (open.side = !open.side)}>Side</Button>
    <Popover open={open.side} caret align="right-start"
      ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
    >
  </div>
</div>

<!-- At the window's left edge: `start` is the right in RTL. -->
<div data-testid="toggletip-start" style="padding: 0 0.25rem">
  <Toggletip align="start" iconDescription="Toggletip at the start"
    ><p>{text}</p></Toggletip
  >
</div>

<div data-testid="plain" style="position: relative; margin: 1rem">
  <Button size="sm" on:click={() => (open.plain = !open.plain)}>Plain</Button>
  <Popover open={open.plain} caret align="bottom-left"
    ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
  >
</div>

<div
  data-testid="scroll-box"
  style="overflow: auto; height: 5rem; margin: 6rem 1rem 1rem; border: 1px solid; padding: 0.5rem"
>
  <div data-testid="scroll" style="position: relative; display: inline-block">
    <Button size="sm" on:click={() => (open.scroll = !open.scroll)}
      >Panel</Button
    >
    <Popover open={open.scroll} caret align="bottom-left"
      ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
    >
  </div>
</div>

<div
  data-testid="card-box"
  style="overflow: hidden; margin: 1rem; border: 1px solid; padding: 0.5rem"
>
  <div data-testid="card" style="position: relative; display: inline-block">
    <Button size="sm" on:click={() => (open.card = !open.card)}>Card</Button>
    <Popover open={open.card} caret align="bottom-left"
      ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
    >
  </div>
  <span data-testid="toggletip-card">
    <Toggletip align="start" iconDescription="Toggletip in a card"
      ><p>{text}</p></Toggletip
    >
  </span>
</div>

<!-- Centered, with no room on either side at 320px. -->
<div style="display: flex; justify-content: center; padding: 1rem 0">
  <div data-testid="narrow" style="position: relative">
    <Button size="sm" on:click={() => (open.narrow = !open.narrow)}
      >Narrow</Button
    >
    <Popover open={open.narrow} caret align="right"
      ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
    >
  </div>
</div>
<div style="display: flex; justify-content: center; padding: 1rem 0">
  <div data-testid="narrow-portal" style="position: relative">
    <Button size="sm" on:click={() => (open.narrowPortal = !open.narrowPortal)}
      >Narrow portal</Button
    >
    <Popover open={open.narrowPortal} caret align="left" portalPopover
      ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
    >
  </div>
</div>
<div style="display: flex; justify-content: center; padding: 1rem 0">
  <div data-testid="toggletip-narrow">
    <Toggletip direction="left" iconDescription="Toggletip with no side room"
      ><p>{text}</p></Toggletip
    >
  </div>
</div>

<div style="height: 120vh"></div>

<div
  data-testid="bottom"
  style="position: relative; display: inline-block; margin: 0 1rem 0.5rem"
>
  <Button size="sm" on:click={() => (open.bottom = !open.bottom)}>Bottom</Button
  >
  <Popover open={open.bottom} caret align="bottom-left"
    ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
  >
</div>
