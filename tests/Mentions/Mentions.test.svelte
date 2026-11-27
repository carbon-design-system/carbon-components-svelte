<script lang="ts">
  import Mentions from "carbon-components-svelte/Mentions/Mentions.svelte";
  import TextArea from "carbon-components-svelte/TextArea/TextArea.svelte";
  import TextInput from "carbon-components-svelte/TextInput/TextInput.svelte";
  import type { ComponentProps } from "svelte";

  export let triggers: ComponentProps<Mentions>["triggers"] = [
    {
      char: "@",
      items: [
        { id: "u1", text: "Alice Smith", secondary: "alice" },
        { id: "u2", text: "Alina Jones", secondary: "alina" },
        { id: "u3", text: "Bob Brown", secondary: "bob" },
      ],
    },
  ];
  export let input = false;
  export let mentions: ComponentProps<Mentions>["mentions"] = [];
  export let open = false;
  export let value = "";
  export let onSelect: (detail: unknown) => void = () => {};

  let textRef: null | HTMLTextAreaElement = null;
  let inputRef: null | HTMLInputElement = null;
  $: field = input ? inputRef : textRef;
</script>

{#if input}
  <TextInput bind:ref={inputRef} bind:value labelText="Field" />
{:else}
  <TextArea bind:ref={textRef} bind:value labelText="Field" />
{/if}
<Mentions
  {field}
  {triggers}
  bind:mentions
  bind:open
  on:select={(event) => onSelect(event.detail)}
>
  <svelte:fragment let:item let:highlighted>
    <span data-highlighted={highlighted}>{item.text}</span>
  </svelte:fragment>
</Mentions>

<p data-testid="mentions">{JSON.stringify(mentions)}</p>
