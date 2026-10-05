<script>
  import { ComboBox, Dropdown, MultiSelect } from "carbon-components-svelte";

  const items = Array.from({ length: 2000 }, (_, i) => ({
    id: i,
    text: `Item ${i}`,
  }));

  // `?component=` picks the listbox; `?optimizeFastScroll` turns the option
  // on, so one suite covers every pairing.
  const params = new URLSearchParams(location.search);
  const component = params.get("component") ?? "Dropdown";
  const virtualize = {
    optimizeFastScroll: params.has("optimizeFastScroll"),
  };
</script>

<div class="field">
  {#if component === "ComboBox"}
    <ComboBox labelText="Items" {items} portalMenu={false} {virtualize} />
  {:else if component === "MultiSelect"}
    <MultiSelect labelText="Items" {items} portalMenu={false} {virtualize} />
  {:else}
    <Dropdown labelText="Items" {items} portalMenu={false} {virtualize} />
  {/if}
</div>

<style>
  .field {
    width: 320px;
  }
</style>
