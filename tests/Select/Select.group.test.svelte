<script lang="ts">
  import {
    Select,
    SelectItem,
    SelectItemGroup,
  } from "carbon-components-svelte";

  export let selected: string | number | undefined = undefined;
</script>

<Select bind:selected>
  <SelectItem value="default" text="Choose an option" disabled hidden />
  <SelectItemGroup label="Category 1">
    <SelectItem value="option-1" text="Option 1" />
    <SelectItem value="option-2" text="Option 2" />
  </SelectItemGroup>
  <SelectItemGroup label="Category 2">
    <SelectItem value="option-3" text="Option 3" />
    <SelectItem value="option-4" text="Option 4" />
  </SelectItemGroup>
</Select>
