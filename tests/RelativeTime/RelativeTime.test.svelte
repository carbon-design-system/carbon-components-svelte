<script lang="ts">
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";

  const now = Date.parse("2026-09-13T12:00:00Z");
  const fiveMinutesAgo = now - 5 * 60 * 1000;
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
</script>

<RelativeTime
  date={fiveMinutesAgo}
  {now}
  locale="en"
  timeZone="UTC"
  data-testid="basic"
/>

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

<RelativeTime date={fiveMinutesAgo} {now} locale="sv" data-testid="cache-1" />
<RelativeTime date={fiveMinutesAgo} {now} locale="sv" data-testid="cache-2" />

<RelativeTime
  date={new Date(fiveMinutesAgo)}
  {now}
  locale="en"
  data-testid="date-object"
/>

<RelativeTime
  date={new Date(fiveMinutesAgo).toISOString()}
  {now}
  locale="en"
  data-testid="iso-string"
/>

<RelativeTime
  date={fiveMinutesAgo}
  {now}
  locale="en"
  titleFormatOptions={{ dateStyle: "short", timeZone: "UTC" }}
  data-testid="title-options"
/>

<RelativeTime
  date={fiveMinutesAgo}
  {now}
  locale="en"
  titleFormatOptions={{ timeStyle: "short", timeZone: "UTC" }}
  timeZone="Asia/Tokyo"
  data-testid="title-zone-override"
/>

<RelativeTime date={fiveMinutesAgo} {now} locale="ar" data-testid="arabic" />
