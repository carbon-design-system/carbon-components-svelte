<script lang="ts">
  import PageHeader from "carbon-components-svelte/PageHeader/PageHeader.svelte";

  export let sticky = true;

  let stuck = false;
</script>

<PageHeader {sticky} bind:stuck data-testid="header" title="Databases" />
<div data-testid="stuck">{stuck}</div>
