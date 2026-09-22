<script lang="ts">
  import Time from "carbon-icons-svelte/lib/Time.svelte";
  import SearchRecent from "../../src/Search/SearchRecent.svelte";

  export let queries: string[] = ["b", "a"];
  export let removable = false;
  export let labelText = "Recent searches";
  export let hideLabel = false;
  export let variant: "inline" | "list" = "inline";
  export let withIcon = false;
</script>

<SearchRecent
  {queries}
  {removable}
  {labelText}
  {hideLabel}
  {variant}
  icon={withIcon ? Time : undefined}
  on:select={(event) => console.log("select", event.detail.query)}
  on:remove={(event) => console.log("remove", event.detail.query)}
/>
