<script lang="ts">
  import { Column } from "carbon-components-svelte";
  import type { ComponentProps } from "svelte";

  export let as = false;
  export let noGutter = false;
  export let noGutterLeft = false;
  export let noGutterRight = false;
  export let padding = false;
  export let aspectRatio: ComponentProps<Column>["aspectRatio"] = undefined;
  export let sm: ComponentProps<Column>["sm"] = undefined;
  export let md: ComponentProps<Column>["md"] = undefined;
  export let lg: ComponentProps<Column>["lg"] = undefined;
  export let xlg: ComponentProps<Column>["xlg"] = undefined;
  export let max: ComponentProps<Column>["max"] = undefined;
</script>

<Column
  {as}
  {noGutter}
  {noGutterLeft}
  {noGutterRight}
  {padding}
  {aspectRatio}
  {sm}
  {md}
  {lg}
  {xlg}
  {max}
>
  <div data-testid="content">Column Content</div>
</Column>
