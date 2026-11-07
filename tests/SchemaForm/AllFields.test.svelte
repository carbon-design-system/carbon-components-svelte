<script lang="ts">
  import SchemaForm from "carbon-components-svelte/SchemaForm/SchemaForm.svelte";
  import type {
    SchemaFormStore,
    WidgetComponent,
  } from "carbon-components-svelte/SchemaForm/create-form.js";

  export let form: SchemaFormStore;
  export let fluid = false;
  export let native = false;
  export let labels: Record<string, unknown> = {};
  export let widgets: Record<string, WidgetComponent> = {};
  export let onsubmit: (values: unknown) => void = () => {};
  export let oninvalid: (errors: unknown) => void = () => {};
</script>

<SchemaForm
  {form}
  {fluid}
  {native}
  {labels}
  {widgets}
  on:submit={(event) => onsubmit(event.detail)}
  on:invalid={(event) => oninvalid(event.detail)}
  data-testid="form"
/>
