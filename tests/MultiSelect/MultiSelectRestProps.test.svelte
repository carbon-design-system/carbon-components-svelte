<script lang="ts">
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
  export let labelText = "";
  export let filterable = false;
</script>

<MultiSelect
  {items}
  {labelText}
  {filterable}
  aria-invalid="true"
  aria-required="true"
  data-custom="passthrough"
  class="custom-class"
/>
