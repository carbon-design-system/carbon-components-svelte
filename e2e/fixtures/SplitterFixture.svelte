<script>
  import { Splitter } from "carbon-components-svelte";

  let size = 30;
  let resizes = 0;
</script>

<div style="width: 600px; height: 300px;">
  <Splitter
    data-testid="splitter"
    bind:size
    min={10}
    max={80}
    separatorLabel="Resize file tree"
    on:resize={() => resizes++}
  >
    <div slot="start">
      <p>File tree</p>
      <a href="#file">A link under the drag path</a>
    </div>
    <Splitter
      slot="end"
      data-testid="inner-splitter"
      orientation="vertical"
      separatorLabel="Resize terminal"
    >
      <p slot="start">Editor</p>
      <p slot="end">Terminal</p>
    </Splitter>
  </Splitter>
</div>
<div data-testid="size-display">{size}</div>
<div data-testid="resize-count">{resizes}</div>
