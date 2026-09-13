<script lang="ts">
  import RelativeTime from "carbon-components-svelte/RelativeTime/RelativeTime.svelte";

  export let dateA: number;
  export let dateB: number;
</script>

<RelativeTime date={dateA} locale="en" data-testid="live-a" />
<RelativeTime date={dateB} locale="en" data-testid="live-b" />
