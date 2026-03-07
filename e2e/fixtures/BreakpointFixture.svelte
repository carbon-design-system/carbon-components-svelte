<script>
  import { Breakpoint } from "carbon-components-svelte";
</script>

<Breakpoint let:size let:sizes>
  <div data-testid="current-size">{size}</div>
  <div data-testid="is-sm">{sizes.sm}</div>
  <div data-testid="is-md">{sizes.md}</div>
  <div data-testid="is-lg">{sizes.lg}</div>
  <div data-testid="is-xlg">{sizes.xlg}</div>
  <div data-testid="is-max">{sizes.max}</div>
</Breakpoint>
