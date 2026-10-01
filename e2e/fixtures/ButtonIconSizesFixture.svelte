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
  const sizes = ["small", "field", "default", "lg", "xl"];
</script>

<!--
  Every button kind at every size with a text + icon layout, plus expressive
  and icon-only expressive. Snapshot coverage for the `.bx--btn__icon` fill
  rules across sizes.
-->
{#each kinds as kind}
  <div data-testid="size-{kind}">
    {#each sizes as size}
      <Button {kind} {size} icon={Add}>Text</Button>
    {/each}
    <Button {kind} expressive icon={Add}>Text</Button>
    <Button {kind} expressive icon={Add} iconDescription="Add" />
  </div>
{/each}
