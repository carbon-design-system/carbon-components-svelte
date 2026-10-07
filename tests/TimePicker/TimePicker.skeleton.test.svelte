<script lang="ts">
  import TimePickerSkeleton from "carbon-components-svelte/TimePicker/TimePickerSkeleton.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<TimePickerSkeleton>["size"] = undefined;
</script>

<TimePickerSkeleton data-testid="time-picker-skeleton" {size} />
