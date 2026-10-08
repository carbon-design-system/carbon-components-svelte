<script lang="ts">
  import Dropdown from "carbon-components-svelte/Dropdown/Dropdown.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<Dropdown>["items"] = [];
</script>

<form id="outside-form" data-testid="form"></form>

<Dropdown
  required
  form="outside-form"
  name="channel"
  labelText="Channel"
  {items}
/>
