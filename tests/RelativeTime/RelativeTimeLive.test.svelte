<script lang="ts">
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";

  export let date: number;
  export let live = true;
  export let now: number | undefined = undefined;
  export let minUnit: "second" | "minute" = "second";
  export let absoluteAfter: number | undefined = undefined;
</script>

<RelativeTime
  {date}
  {live}
  {now}
  {minUnit}
  {absoluteAfter}
  locale="en"
  timeZone="UTC"
  data-testid="live"
/>
