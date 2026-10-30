<script>
  import { AILabel, NumberInput } from "carbon-components-svelte";

  const sizes = ["xs", "sm", undefined, "xl"];
</script>

<div style="width: 16rem; padding: 1rem">
  {#each sizes as size}
    <div data-testid={size ?? "md"}>
      <NumberInput
        {size}
        readonly
        hideSteppers
        labelText="Replicas"
        value={123456789012}
      >
        <AILabel slot="decorator" />
      </NumberInput>
    </div>
  {/each}
</div>
