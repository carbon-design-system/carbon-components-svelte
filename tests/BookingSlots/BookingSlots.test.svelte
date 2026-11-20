<script lang="ts">
  import BookingSlots from "carbon-components-svelte/BookingSlots/BookingSlots.svelte";
  import type { ComponentProps } from "svelte";

  export let value: ComponentProps<BookingSlots>["value"] = null;
  export let timeZone = "America/New_York";
  export let date: ComponentProps<BookingSlots>["date"] = null;
  export let changes: unknown[] = [];
  export let zoneChanges: unknown[] = [];
  export let errors: unknown[] = [];
</script>

<BookingSlots
  bind:value
  bind:timeZone
  bind:date
  on:change={(event) => (changes = [...changes, event.detail])}
  on:zonechange={(event) => (zoneChanges = [...zoneChanges, event.detail])}
  on:error={(event) => (errors = [...errors, event.detail])}
  {...$$restProps}
/>
<p data-testid="value">{value}</p>
<p data-testid="date">{date}</p>
<p data-testid="zone">{timeZone}</p>
<p data-testid="changes">{JSON.stringify(changes)}</p>
<p data-testid="zone-changes">{JSON.stringify(zoneChanges)}</p>
<p data-testid="errors">{errors.length}</p>
