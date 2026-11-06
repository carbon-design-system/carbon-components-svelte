<script>
  import { Button, gesture, Stack } from "carbon-components-svelte";

  let pad;
  let touchAction = "";
  let entries = [];
  let counts = {
    tap: 0,
    doubletap: 0,
    longpress: 0,
    pan: 0,
    pinch: 0,
    swipe: 0,
  };

  function log(type, text) {
    counts = { ...counts, [type]: counts[type] + 1 };
    entries = [`${type}: ${text}`, ...entries].slice(0, 8);
  }

  function clear() {
    entries = [];
    counts = { tap: 0, doubletap: 0, longpress: 0, pan: 0, pinch: 0, swipe: 0 };
  }

  const round = (value) => Math.round(value * 100) / 100;

  const options = {
    tap: (event) =>
      log(
        "tap",
        `${event.pointerType} at ${event.clientX | 0}, ${event.clientY | 0}`,
      ),
    doubleTap: (event) => log("doubletap", `${event.pointerType}`),
    longPress: {
      onLongPress: (event) => log("longpress", `${event.pointerType}`),
    },
    pan: {
      onEnd: (event) =>
        log(
          "pan",
          `${event.pointerType} ${event.cancelled ? "cancelled" : "dx " + (event.deltaX | 0) + ", dy " + (event.deltaY | 0)}`,
        ),
    },
    pinch: {
      onEnd: (event) =>
        log("pinch", `${event.source} scale ${round(event.scale)}`),
    },
    swipe: (event) =>
      log(
        "swipe",
        `${event.direction} at ${round(Math.abs(event.velocityX || event.velocityY))} px/ms`,
      ),
  };

  // The action sets `touch-action` for the gestures it was given.
  function readTouchAction(node) {
    touchAction = node.style.touchAction;
    return {};
  }
</script>

<Stack gap={4}>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    bind:this={pad}
    class="pad"
    data-testid="pad"
    role="group"
    tabindex="0"
    aria-label="Gesture pad"
    use:gesture={options}
    use:readTouchAction
  >
    Try a tap, double tap, hold, drag, swipe or pinch here
  </div>
  <p class="help">
    The pad has no keyboard equivalent because it only reports gestures. A
    control that uses one needs a button or a key for the same action.
  </p>
  <div class="actions">
    <Button size="small" kind="ghost" on:click={clear}>Clear</Button>
    <span class="level" data-testid="touch-action"
      >touch-action: {touchAction}</span
    >
  </div>
  <ol class="log" aria-label="Recognized gestures" data-testid="log">
    {#each entries as entry}
      <li>{entry}</li>
    {:else}
      <li class="none">Nothing yet</li>
    {/each}
  </ol>
  <dl hidden data-testid="counts">
    {#each Object.entries(counts) as [name, count]}
      <dt>{name}</dt>
      <dd data-testid="count-{name}">{count}</dd>
    {/each}
  </dl>
</Stack>

<style>
  .pad {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 12rem;
    padding: var(--cds-spacing-05);
    color: var(--cds-text-secondary);
    text-align: center;
    background: var(--cds-layer-01);
    border: 1px dashed var(--cds-border-strong-01);
    user-select: none;
  }

  .pad:focus-visible {
    outline: 2px solid var(--cds-focus);
    outline-offset: -2px;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--cds-spacing-03);
  }

  .level {
    margin-inline-start: auto;
    color: var(--cds-text-secondary);
    font-family: var(--cds-code-02-font-family, monospace);
  }

  .log {
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--cds-code-02-font-family, monospace);
    font-size: var(--cds-code-02-font-size, 0.875rem);
  }

  .none {
    color: var(--cds-text-secondary);
  }

  .help {
    color: var(--cds-text-secondary);
    font-size: var(--cds-helper-text-01-font-size, 0.75rem);
  }

  @media (forced-colors: active) {
    .pad:focus-visible {
      outline-color: Highlight;
    }
  }
</style>
