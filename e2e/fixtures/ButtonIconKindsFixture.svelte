<script>
  import { Button } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";

  const kinds = [
    "primary",
    "secondary",
    "tertiary",
    "ghost",
    "danger",
    "danger-tertiary",
    "danger-ghost",
  ];
</script>

<!--
  Every button kind with an icon, as text + icon, icon-only (with and without
  a tooltip), disabled, and selected. Snapshot coverage for the `.bx--btn__icon`
  fill rules, which differ per kind and per layout.
-->
{#each kinds as kind}
  <div data-testid="kind-{kind}">
    <Button {kind} icon={Add}>Text</Button>
    <Button {kind} icon={Add} iconDescription="Add" />
    <Button {kind} icon={Add} aria-label="Add" />
    <Button {kind} icon={Add} disabled>Text</Button>
    <Button {kind} icon={Add} iconDescription="Add" disabled />
    <Button {kind} icon={Add} iconDescription="Add" isSelected />
  </div>
{/each}

<!-- The same, with the icon in the `icon` slot and no class on it. -->
{#each kinds as kind}
  <div data-testid="slot-kind-{kind}">
    <Button {kind}>Text<Add slot="icon" /></Button>
    <Button {kind} iconDescription="Add"><Add slot="icon" /></Button>
    <Button {kind} aria-label="Add"><Add slot="icon" /></Button>
    <Button {kind} disabled>Text<Add slot="icon" /></Button>
    <Button {kind} iconDescription="Add" disabled><Add slot="icon" /></Button>
    <Button {kind} iconDescription="Add" isSelected><Add slot="icon" /></Button>
  </div>
{/each}
<div data-testid="kind-expressive">
  <Button expressive icon={Add}>Text</Button>
</div>
<div data-testid="slot-kind-expressive">
  <Button expressive>Text<Add slot="icon" /></Button>
</div>
