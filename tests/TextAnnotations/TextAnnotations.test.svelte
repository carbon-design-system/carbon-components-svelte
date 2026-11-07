<script lang="ts">
  import TextAnnotations from "carbon-components-svelte/TextAnnotations/TextAnnotations.svelte";

  export let annotations: Array<{
    id: string;
    range: { start: number; end: number };
    quote: string;
    prefix?: string;
    suffix?: string;
    comments: Array<{
      id: string;
      author: { name: string };
      body: string;
    }>;
  }> = [];
  export let activeId: string | null = null;
  export let highlight: "auto" | "highlight-api" | "mark" = "mark";
  export let readonly = false;
  export let text: string | undefined = undefined;
  export let onreanchor: (detail: unknown) => void = () => {};
  export let oncreate: (event: CustomEvent) => void = () => {};
  export let onreply: (event: CustomEvent) => void = () => {};
</script>

{#if text !== undefined}
  <TextAnnotations
    bind:annotations
    bind:activeId
    {highlight}
    {readonly}
    {text}
    labelText="Service agreement"
    user={{ name: "Ada Lovelace" }}
    on:reanchor={(event) => onreanchor(event.detail)}
    on:create={oncreate}
    on:reply={onreply}
  />
{:else}
  <TextAnnotations
    bind:annotations
    bind:activeId
    {highlight}
    {readonly}
    labelText="Service agreement"
    user={{ name: "Ada Lovelace" }}
    on:reanchor={(event) => onreanchor(event.detail)}
    on:create={oncreate}
    on:reply={onreply}
  >
    <p>
      The <em>Supplier</em
      >{" shall deliver the goods within thirty days of the order date."}
    </p>
    <p>Payment is due <strong>sixty days</strong>{" after delivery."}</p>
  </TextAnnotations>
{/if}

<output data-testid="count">{annotations.length}</output>
<output data-testid="active">{activeId ?? ""}</output>
