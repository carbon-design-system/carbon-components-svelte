<script lang="ts">
  import { MultiSelect } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let items: ComponentProps<MultiSelect>["items"] = [];
</script>

<MultiSelect {items} let:item let:index>
  <div>
    <strong>{item.id} {item.text} {index}</strong>
  </div>
</MultiSelect>
