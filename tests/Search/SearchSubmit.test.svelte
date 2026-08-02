<script lang="ts">
  import Search from "carbon-components-svelte/Search/Search.svelte";

  export let showSubmitButton = true;
  export let value = "Cloud functions";
  export let disabled = false;

  let submitted: string | null = null;
</script>

<Search
  bind:value
  {showSubmitButton}
  {disabled}
  labelText="Submit search"
  placeholder="Search"
  on:submit={(e) => {
    submitted = String(e.detail.value);
    console.log("submit", e.detail.value);
  }}
/>

<div data-testid="submitted">{submitted ?? ""}</div>
