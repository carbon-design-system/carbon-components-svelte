<script>
  import { MarkdownEditor } from "carbon-components-svelte";

  let value = "make this bold\n\n- one\n- two";
  let view = "write";
  let splitValue = "# Split\n\nType **here**.";
  let splitView = "write";
  let splitActive = false;
</script>

<div data-testid="main-host" style="max-width: 640px">
  <MarkdownEditor
    labelText="Notes"
    helperText="Supports Markdown"
    bind:value
    bind:view
    name="notes"
    maxCount={500}
  />
  <output data-testid="bound">{value}</output>
  <output data-testid="view">{view}</output>
</div>

<div data-testid="split-host" style="width: 960px; max-width: 100%">
  <MarkdownEditor
    labelText="Split"
    split
    bind:value={splitValue}
    bind:view={splitView}
    bind:splitActive
    rows={6}
  />
  <output data-testid="split-active">{splitActive}</output>
</div>

<div data-testid="states-host" style="max-width: 640px">
  <MarkdownEditor
    labelText="Invalid"
    invalid
    invalidText="Notes are required"
    value=""
  />
  <MarkdownEditor labelText="Warning" warn warnText="Looks long" value="x" />
  <MarkdownEditor labelText="Disabled" disabled value="# Disabled" />
  <MarkdownEditor labelText="Read only" readonly value="# Read only" />
</div>
