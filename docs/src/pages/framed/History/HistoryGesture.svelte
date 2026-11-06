<script>
  import {
    Button,
    createHistory,
    historyKeys,
    Slider,
    Stack,
  } from "carbon-components-svelte";

  let value = 40;
  let dragging = false;
  let steps = 0;

  const history = createHistory();
  const { canUndo, canRedo } = history;
  const opacity = history.snapshots({
    initial: value,
    apply: (next) => (value = next),
  });

  // `input` fires for every value on the way. Inside a drag they all land
  // in one group; from the keyboard they fold, because they share a key.
  function onInput(event) {
    opacity.record(event.detail, { key: "opacity", label: "set opacity" });
  }

  function start() {
    if (dragging) return;
    dragging = true;
    history.begin("set opacity");
    window.addEventListener("pointerup", end, { once: true });
    window.addEventListener("pointercancel", end, { once: true });
  }

  function end() {
    if (!dragging) return;
    dragging = false;
    if (history.commit()) steps += 1;
  }

  // Escape mid-drag puts the value back and records nothing.
  function onKeydown(event) {
    if (event.key === "Escape" && dragging) {
      dragging = false;
      history.cancel();
    }
  }
</script>

<div role="presentation" use:historyKeys={history} on:keydown={onKeydown}>
  <Stack gap={5}>
    <div role="presentation" on:pointerdown|capture={start}>
      <Slider
        labelText="Opacity"
        min={0}
        max={100}
        bind:value
        on:input={onInput}
      />
    </div>
    <Stack orientation="horizontal" gap={3}>
      <Button
        kind="tertiary"
        size="small"
        disabled={!$canUndo}
        on:click={() => history.undo()}>Undo</Button
      >
      <Button
        kind="tertiary"
        size="small"
        disabled={!$canRedo}
        on:click={() => history.redo()}>Redo</Button
      >
    </Stack>
    <p>
      Drags kept as steps: {steps}. Press Escape during a drag to cancel it.
    </p>
  </Stack>
</div>
