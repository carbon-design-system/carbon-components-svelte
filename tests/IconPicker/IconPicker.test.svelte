<script lang="ts">
  import IconPicker from "carbon-components-svelte/IconPicker/IconPicker.svelte";
  import { toIconItems } from "carbon-components-svelte/IconPicker/icon-items.js";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
  import Edit from "carbon-icons-svelte/lib/Edit.svelte";

  export let value: string | undefined = undefined;
  export let variant: "popover" | "inline" = "popover";
  export let name = "";
  /** Icons given as components, as loaders, or as a function that returns the list. */
  export let mode: "components" | "loaders" | "function" = "components";

  let imports = 0;
  let listCalls = 0;
  let changes: string[] = [];

  const components = toIconItems({ Add, Edit });
  const loaders = toIconItems({
    Add: () => {
      imports += 1;
      return Promise.resolve({ default: Add });
    },
    Edit: () => {
      imports += 1;
      return Promise.resolve({ default: Edit });
    },
  });

  function list() {
    listCalls += 1;
    return Promise.resolve(loaders);
  }

  $: items =
    mode === "function" ? list : mode === "loaders" ? loaders : components;
</script>

<IconPicker
  bind:value
  {variant}
  {name}
  {items}
  labelText="Icon"
  on:change={({ detail }) =>
    (changes = [...changes, `${detail.value}:${typeof detail.icon}`])}
/>
<output data-testid="value">{value ?? ""}</output>
<output data-testid="changes">{changes.join(",")}</output>
<output data-testid="imports">{imports}</output>
<output data-testid="list-calls">{listCalls}</output>
