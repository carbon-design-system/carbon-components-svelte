<script lang="ts">
  import ActionSet from "carbon-components-svelte/ActionSet/ActionSet.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
  import type { ComponentProps } from "svelte";

  export let size: ComponentProps<ActionSet>["size"] = "lg";
  export let kinds: ComponentProps<Button>["kind"][] = ["secondary", "primary"];
</script>

<ActionSet {size}>
  {#each kinds as kind, index (index)}
    <Button {kind}>Action {index + 1}</Button>
  {/each}
</ActionSet>
