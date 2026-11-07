<script lang="ts">
  import TokenSearch from "carbon-components-svelte/TokenSearch/TokenSearch.svelte";
</script>

<TokenSearch
  value="is:open nope:1"
  labelText="Query"
  keys={[{ key: "is", type: "enum", values: ["open", "closed"] }]}
/>
