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
