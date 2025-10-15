<script lang="ts">
  import { Row } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let condensed: ComponentProps<Row>["condensed"] = false;
  export let narrow: ComponentProps<Row>["narrow"] = false;
  export let noGutter: ComponentProps<Row>["noGutter"] = false;
  export let noGutterLeft: ComponentProps<Row>["noGutterLeft"] = false;
  export let noGutterRight: ComponentProps<Row>["noGutterRight"] = false;
  export let padding: ComponentProps<Row>["padding"] = false;
  export let as: ComponentProps<Row>["as"] = false;
</script>

{#if as}
  <Row
    {as}
    {condensed}
    {narrow}
    {noGutter}
    {noGutterLeft}
    {noGutterRight}
    {padding}
    let:props
  >
    <section {...props} data-testid="custom-row">Row content</section>
  </Row>
{:else}
  <Row
    {condensed}
    {narrow}
    {noGutter}
    {noGutterLeft}
    {noGutterRight}
    {padding}
    data-testid="test-row"
  >
    Row content
  </Row>
{/if}
