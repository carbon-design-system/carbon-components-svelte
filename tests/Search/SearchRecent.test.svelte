<script lang="ts">
  import SearchRecent from "../../src/Search/SearchRecent.svelte";

  export let queries: string[] = ["b", "a"];
  export let removable = false;
  export let labelText = "Recent searches";
  export let hideLabel = false;
</script>

<SearchRecent
  {queries}
  {removable}
  {labelText}
  {hideLabel}
  on:select={(event) => console.log("select", event.detail.query)}
  on:remove={(event) => console.log("remove", event.detail.query)}
/>
