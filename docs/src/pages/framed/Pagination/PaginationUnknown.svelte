<script>
  import { Pagination } from "carbon-components-svelte";

  // Simulate a cursor-based API where the total is unknown.
  const LAST_PAGE = 5;

  let page = 1;
  let pageSize = 10;

  $: forwardButtonDisabled = page >= LAST_PAGE;
</script>

<Pagination pagesUnknown bind:page bind:pageSize {forwardButtonDisabled} />
