<script lang="ts">
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";

  export let date: number;
  export let live = true;
  export let now: number | undefined = undefined;
</script>

<RelativeTime {date} {live} {now} locale="en" data-testid="live" />
