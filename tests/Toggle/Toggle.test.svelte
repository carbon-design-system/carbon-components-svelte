<svelte:options accessors />

<script lang="ts">
  import { Toggle } from "carbon-components-svelte";

  let toggled = false;
  let initialToggled = true;
  export let ref: HTMLInputElement | null = null;
</script>

<Toggle
  bind:toggled
  bind:ref
  labelText="Default toggle"
  on:toggle={(e) => {
    console.log("toggled:", e.detail.toggled);
  }}
  on:change={(e) => {
    if (e.target instanceof HTMLInputElement) {
      console.log("change:", e.target.checked);
    }
  }}
/>

<Toggle labelText="Custom labels" labelA="Inactive" labelB="Active" />

<Toggle size="sm" labelText="Small toggle" />

<Toggle disabled labelText="Disabled toggle" />

<Toggle
  hideLabel
  labelText="Hidden label toggle"
  aria-label="Hidden label toggle"
/>

<Toggle
  bind:toggled={initialToggled}
  labelText="Initial toggled state"
  name="test-toggle"
  on:toggle={(e) => {
    console.log("initial toggled:", e.detail.toggled);
  }}
/>

<Toggle labelText="Custom name toggle" name="custom-name-toggle" />

<Toggle id="custom-id" labelText="Custom id toggle" />

<Toggle
  labelText="Events toggle"
  on:focus={() => {
    console.log("focus");
  }}
  on:blur={() => {
    console.log("blur");
  }}
  on:click={() => {
    console.log("click");
  }}
/>

<Toggle class="custom-class" labelText="Custom class toggle" />

<Toggle labelText="Slots toggle">
  <span slot="labelText">Label slot</span>
  <span slot="labelA">Off slot</span>
  <span slot="labelB">On slot</span>
</Toggle>
