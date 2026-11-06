<script lang="ts">
  import InlineSuggest from "carbon-components-svelte/InlineSuggest/InlineSuggest.svelte";
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  export let source: ComponentProps<InlineSuggest>["source"] = [
    "gmail.com",
    "github.com",
  ];
  export let after = "@";
  export let acceptKeys: ComponentProps<InlineSuggest>["acceptKeys"] = [
    "Tab",
    "ArrowRight",
  ];
  export let multiline = false;
  export let value = "";
  export let helperText = "";
  export let suggestion = "";
  export let onAccept: (detail: unknown) => void = () => {};
  export let onDismiss: (detail: unknown) => void = () => {};

  let textRef: null | HTMLTextAreaElement = null;
  let inputRef: null | HTMLInputElement = null;
  $: field = multiline ? textRef : inputRef;
</script>

{#if multiline}
  <TextArea bind:ref={textRef} bind:value labelText="Message" {helperText} />
{:else}
  <TextInput bind:ref={inputRef} bind:value labelText="Email" {helperText} />
{/if}
<InlineSuggest
  {field}
  {source}
  {after}
  {acceptKeys}
  bind:suggestion
  on:accept={(event) => onAccept(event.detail)}
  on:dismiss={(event) => onDismiss(event.detail)}
/>
<input aria-label="Next" />
<p data-testid="value">{value}</p>
