<script lang="ts">
  import InlineTip from "carbon-components-svelte/InlineTip/InlineTip.svelte";
  import type { ComponentProps } from "svelte";

  export let id: ComponentProps<InlineTip>["id"] = "filters";
  export let withId = true;
  export let title = "Filter by owner";
  export let collapsible = false;
  export let collapsed = false;
  export let dismissible = true;
  export let href: ComponentProps<InlineTip>["href"] = undefined;
  export let headingLevel: ComponentProps<InlineTip>["headingLevel"] =
    undefined;
  export let dismissText: ComponentProps<InlineTip>["dismissText"] = undefined;
  export let store: ComponentProps<InlineTip>["store"] = undefined;
  export let onDismiss: (
    e: CustomEvent<{ id: string | undefined }>,
  ) => void = () => {};
  export let onToggle: (
    e: CustomEvent<{ collapsed: boolean }>,
  ) => void = () => {};
</script>

<button type="button">Before</button>
<InlineTip
  id={withId ? id : undefined}
  {title}
  {collapsible}
  bind:collapsed
  {dismissible}
  {href}
  {headingLevel}
  {dismissText}
  {store}
  data-testid="tip"
  on:dismiss={onDismiss}
  on:toggle={onToggle}
>
  Filters narrow the table to one person's rows.
</InlineTip>
<button type="button">After</button>
<span data-testid="collapsed">{collapsed}</span>
