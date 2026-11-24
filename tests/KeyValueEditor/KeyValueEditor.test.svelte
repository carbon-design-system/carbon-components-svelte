<script lang="ts">
  import KeyValueEditor from "carbon-components-svelte/KeyValueEditor/KeyValueEditor.svelte";
  import type { KeyValueRow } from "carbon-components-svelte/KeyValueEditor/rows.js";
  import type { ComponentProps } from "svelte";

  export let rows: KeyValueRow[] = [];
  export let config: Partial<ComponentProps<KeyValueEditor>> = {};
  export let onAdd: (detail: unknown) => void = () => {};
  export let onRemove: (detail: unknown) => void = () => {};
  export let onMove: (detail: unknown) => void = () => {};
  export let onPaste: (detail: unknown) => void = () => {};
  export let onImport: (detail: unknown) => void = () => {};
  export let onChange: (detail: unknown) => void = () => {};
  export let cancel: "" | "add" | "remove" | "move" | "paste" = "";
  export let valid = true;
  export let issues: ComponentProps<KeyValueEditor>["issues"] = [];
  let editor: KeyValueEditor | undefined;
  let reported: boolean | undefined;
</script>

<form data-testid="form">
  <KeyValueEditor
    bind:this={editor}
    labelText="Variables"
    {...config}
    bind:rows
    bind:valid
    bind:issues
    on:add={(e) => {
      onAdd(e.detail);
      if (cancel === "add") e.preventDefault();
    }}
    on:remove={(e) => {
      onRemove(e.detail);
      if (cancel === "remove") e.preventDefault();
    }}
    on:move={(e) => {
      onMove(e.detail);
      if (cancel === "move") e.preventDefault();
    }}
    on:paste={(e) => {
      onPaste(e.detail);
      if (cancel === "paste") e.preventDefault();
    }}
    on:import={(e) => onImport(e.detail)}
    on:change={(e) => onChange(e.detail)}
  />
</form>

<button type="button" on:click={() => (reported = editor?.reportValidity())}
  >Check rows</button
>
<div data-testid="reported">{String(reported)}</div>
<div data-testid="rows">{JSON.stringify(rows)}</div>
<div data-testid="valid">{String(valid)}</div>
