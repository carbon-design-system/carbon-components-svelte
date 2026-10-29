<script lang="ts">
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  export let loading = false;
  export let loadingDelay = 0;
  export let onClick: () => void = () => {};
</script>

<Button
  data-testid="btn-icon-only-loading"
  icon={Add}
  iconDescription="Add item"
  loadingDescription="Adding item"
  {loading}
/>

<Button data-testid="btn-labeled-loading" {loading} {loadingDelay}
  >Submit</Button
>

<Button data-testid="btn-href-loading" href="#" {loading}>Link</Button>

<Button data-testid="btn-skeleton-loading" skeleton {loading} />

<Button
  data-testid="btn-click-guard"
  {loading}
  {loadingDelay}
  on:click={onClick}
>
  Submit
</Button>
