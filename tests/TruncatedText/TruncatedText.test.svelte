<svelte:options accessors />

<script lang="ts">
  import TruncatedText from "carbon-components-svelte/TruncatedText/TruncatedText.svelte";
  import type { ComponentProps } from "svelte";

  export let id: ComponentProps<TruncatedText>["id"] = undefined;
  export let lines: ComponentProps<TruncatedText>["lines"] = undefined;
  export let type: ComponentProps<TruncatedText>["type"] = undefined;
  export let expandLabel: ComponentProps<TruncatedText>["expandLabel"] =
    undefined;
  export let collapseLabel: ComponentProps<TruncatedText>["collapseLabel"] =
    undefined;
  export let text = "The quick brown fox jumps over the lazy dog.";
</script>

<TruncatedText
  {id}
  {lines}
  {type}
  {expandLabel}
  {collapseLabel}
  data-testid="truncated-text"
>
  {text}
</TruncatedText>
