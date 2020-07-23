<script>
  export let page = 0;

  import PaginationNav from "./PaginationNav.svelte";
  import { Button } from "../Button";
</script>

<div style="width: 800px;">
  <PaginationNav
    {...$$props}
    bind:page
    on:change={({ detail }) => {
      console.log('on:change', detail);
    }}
    on:click:button--previous={({ detail }) => {
      console.log('button--previous', detail);
    }}
    on:click:button--next={({ detail }) => {
      console.log('button--next', detail);
    }} />
  <div style="margin-top: 1.5rem">Bound page index: {page}</div>
  <Button
    kind="tertiary"
    size="small"
    style="margin-top: 1rem;"
    on:click={() => {
      page = 3;
    }}>
    Set page to index 3
  </Button>
</div>
