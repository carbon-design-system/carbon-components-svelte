<script>
  import { pointerDrag } from "carbon-components-svelte/utils/pointer-drag.js";

  let clicks = [];
  let drags = 0;

  function record(mode) {
    return (event) => {
      clicks = [...clicks, `${mode}:${event.target.id}`];
    };
  }
</script>

<div
  class="source"
  id="press"
  use:pointerDrag={{ capture: "press", onEnd: () => drags++ }}
  on:click={record("press")}
>
  Press capture
  <a id="press-link" href="#press-link">Link</a>
</div>

<div
  class="source"
  id="drag"
  use:pointerDrag={{
    capture: "drag",
    onEnd: (_, dragged) => {
      if (dragged) drags++;
    },
  }}
  on:click={record("drag")}
>
  Drag capture
  <a id="drag-link" href="#drag-link">Link</a>
</div>

<p data-testid="clicks">{clicks.join(",")}</p>
<p data-testid="drags">{drags}</p>

<style>
  .source {
    padding: 2rem;
    border: 1px solid;
    margin-bottom: 1rem;
  }
</style>
