<script>
  import { Dropdown } from "carbon-components-svelte";

  const items = [
    { id: "a", text: "Slack" },
    { id: "b", text: "Email", group: "Messages" },
    { id: "c", text: "Fax", group: "Messages" },
  ];
</script>

<!--
  Open Dropdowns in each size, opening up and down, with a group header,
  inline, and loading. CSS coverage for the size, `--up` and menu-status
  rules of `.bx--list-box`, which no other fixture renders open.
-->
{#each ["xs", "sm", "lg", "xl"] as size}
  <div class="row" data-testid="size-{size}">
    <Dropdown {size} {items} labelText="Down {size}" open />
    <Dropdown {size} {items} labelText="Up {size}" direction="top" open />
  </div>
{/each}
<div class="row" data-testid="inline">
  <!-- An open inline menu is 18rem wide from the end of its label; without
       the label it fits a 320px page. -->
  <Dropdown type="inline" {items} labelText="Inline" hideLabel open />
  <Dropdown
    type="inline"
    {items}
    labelText="Inline invalid"
    invalid
    invalidText="Pick one"
  />
</div>
<div class="row" data-testid="loading">
  <Dropdown {items} labelText="Loading" loading loadingDelay={0} open />
</div>

<style>
  .row {
    display: grid;
    gap: 1rem;
    /* Room for the menus that open up and down. */
    padding-block: 12rem;
  }
</style>
