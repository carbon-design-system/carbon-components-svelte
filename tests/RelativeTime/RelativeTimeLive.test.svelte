<script lang="ts">
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";

  export let date: number;
</script>

<RelativeTime {date} locale="en" data-testid="live" />
