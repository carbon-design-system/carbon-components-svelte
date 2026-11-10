<script lang="ts">
  import TimeRangePicker from "carbon-components-svelte/TimeRangePicker/TimeRangePicker.svelte";
  import type { ComponentProps } from "svelte";

  export let value: NonNullable<ComponentProps<TimeRangePicker>["value"]> = {
    from: "now-15m",
    to: "now",
  };
  export let timeZone: ComponentProps<TimeRangePicker>["timeZone"] =
    "America/New_York";
  export let refreshInterval = 0;
  export let open = false;
  export let extra: Partial<ComponentProps<TimeRangePicker>> = {};
  export let onChange: (detail: unknown) => void = () => {};
  export let onRefresh: (detail: unknown) => void = () => {};
  export let onOpen: () => void = () => {};
  export let onClose: () => void = () => {};
</script>

<TimeRangePicker
  now="2026-11-06T17:30:00.000Z"
  {...extra}
  bind:value
  bind:timeZone
  bind:refreshInterval
  bind:open
  on:change={(event) => onChange(event.detail)}
  on:refresh={(event) => onRefresh(event.detail)}
  on:open={onOpen}
  on:close={onClose}
/>
<button type="button" data-testid="outside">Outside</button>
<p data-testid="value">{value.from}..{value.to}</p>
<p data-testid="zone">{timeZone}</p>
<p data-testid="interval">{refreshInterval}</p>
