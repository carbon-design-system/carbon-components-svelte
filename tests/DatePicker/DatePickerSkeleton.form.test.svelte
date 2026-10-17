<script lang="ts">
  import DatePickerSkeleton from "carbon-components-svelte/DatePicker/DatePickerSkeleton.svelte";
  import Form from "carbon-components-svelte/Form/Form.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<Form>["size"] = undefined;
</script>

<Form {size}>
  <DatePickerSkeleton data-testid="skeleton" />
</Form>
