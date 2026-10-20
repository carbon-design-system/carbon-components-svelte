<script lang="ts">
  import Layer from "carbon-components-svelte/Layer/Layer.svelte";

  export let level: 0 | 1 | 2 | undefined = undefined;
  export let withBackground = false;
  export let tag: keyof HTMLElementTagNameMap = "div";
</script>

<Layer
  {level}
  {withBackground}
  {tag}
  class="custom"
  data-testid="outer"
  let:level={outerLevel}
>
  <span data-testid="outer-level">{outerLevel}</span>
  <Layer data-testid="middle" let:level={middleLevel}>
    <span data-testid="middle-level">{middleLevel}</span>
    <Layer data-testid="inner">
      <Layer data-testid="capped" />
    </Layer>
  </Layer>
</Layer>
