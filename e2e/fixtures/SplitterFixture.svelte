<script>
  import { Splitter } from "carbon-components-svelte";

  let size = 30;
  let resizes = 0;
  let previewSize = 30;
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

<div style="width: 600px; height: 200px;">
  <Splitter
    data-testid="iframe-splitter"
    bind:size={previewSize}
    separatorLabel="Resize preview"
  >
    <p slot="start">Editor</p>
    <iframe
      slot="end"
      title="Preview"
      srcdoc="<p>pane</p>"
      style="width:100%;height:200px"
    ></iframe>
  </Splitter>
</div>
<div data-testid="preview-size-display">{previewSize}</div>

<div data-testid="pixel-container" style="width: 600px; height: 100px;">
  <Splitter size={10} min="150px" separatorLabel="Resize sidebar">
    <p slot="start">Sidebar</p>
    <p slot="end">Content</p>
  </Splitter>
</div>
