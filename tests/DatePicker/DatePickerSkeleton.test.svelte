<script lang="ts">
  import DatePickerSkeleton from "carbon-components-svelte/DatePicker/DatePickerSkeleton.svelte";

  export let onmouseover: ((event: MouseEvent) => void) | undefined = undefined;
  export let onmouseenter: ((event: MouseEvent) => void) | undefined =
    undefined;
  export let onmouseleave: ((event: MouseEvent) => void) | undefined =
    undefined;
</script>

<DatePickerSkeleton
  data-testid="date-picker-skeleton"
  {...$$restProps}
  on:mouseover={(e) => onmouseover?.(e)}
  on:mouseenter={(e) => onmouseenter?.(e)}
  on:mouseleave={(e) => onmouseleave?.(e)}
/>
