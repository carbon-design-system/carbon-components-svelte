<script lang="ts">
  import PaginationNav from "carbon-components-svelte/PaginationNav/PaginationNav.svelte";

  export let page = 1;
</script>

<PaginationNav bind:page total={10} data-testid="top" />
<PaginationNav bind:page total={10} data-testid="bottom" />
