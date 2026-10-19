<script>
  import { Button, Popover } from "carbon-components-svelte";

  let open = {
    edge: false,
    bottom: false,
    scroll: false,
    card: false,
    plain: false,
  };
  const text = "Replicated to two zones, backed up nightly, kept for 30 days.";
</script>

<div style="display: flex; justify-content: flex-end; padding: 1rem 0.5rem">
  <div data-testid="edge" style="position: relative">
    <Button size="sm" on:click={() => (open.edge = !open.edge)}>Edge</Button>
    <Popover open={open.edge} caret align="bottom-left"
      ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
    >
  </div>
</div>

<div data-testid="plain" style="position: relative; margin: 1rem">
  <Button size="sm" on:click={() => (open.plain = !open.plain)}>Plain</Button>
  <Popover open={open.plain} caret align="bottom-left"
    ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
  >
</div>

<div
  data-testid="scroll-box"
  style="overflow: auto; height: 5rem; margin: 6rem 1rem 1rem; border: 1px solid #c6c6c6; padding: 0.5rem"
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
  style="overflow: hidden; margin: 1rem; border: 1px solid #c6c6c6; padding: 0.5rem"
>
  <div data-testid="card" style="position: relative; display: inline-block">
    <Button size="sm" on:click={() => (open.card = !open.card)}>Card</Button>
    <Popover open={open.card} caret align="bottom-left"
      ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
    >
  </div>
</div>

<div style="height: 120vh"></div>

<div
  data-testid="bottom"
  style="position: relative; display: inline-block; margin: 0 1rem 0.5rem"
>
  <Button size="sm" on:click={() => (open.bottom = !open.bottom)}
    >Bottom</Button
  >
  <Popover open={open.bottom} caret align="bottom-left"
    ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
  >
</div>
