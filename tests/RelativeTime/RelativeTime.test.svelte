<script lang="ts">
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";

  const now = Date.parse("2026-09-13T12:00:00Z");
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
</script>

<RelativeTime date={fiveMinutesAgo} {now} locale="en" data-testid="basic" />

<RelativeTime
  date={oneDayAgo}
  {now}
  locale="en"
  numeric="always"
  data-testid="numeric-always"
/>
<RelativeTime date={oneDayAgo} {now} locale="en" data-testid="numeric-auto" />

<RelativeTime
  date={fiveMinutesAgo}
  {now}
  locale="en"
  style="short"
  data-testid="short-style"
/>

<RelativeTime
  date={fiveMinutesAgo}
  {now}
  locale="en"
  data-testid="slot-fixture"
  let:formatted
>
  Updated {formatted}
</RelativeTime>

<RelativeTime date="not a date" {now} locale="en" data-testid="invalid" />

<RelativeTime
  date={fiveMinutesAgo}
  {now}
  locale="en"
  title="Custom"
  data-testid="custom-title"
/>
