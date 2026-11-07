<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";

  export let onChange: (detail: {
    id: string;
    item: { id?: string; title: string; code: string };
  }) => void = () => {};
  export let selectedId: string | undefined = undefined;

  const files = [
    { id: "app", title: "App.svelte", code: "<Button>Save</Button>" },
    { title: "main.ts", code: "new App();" },
    { title: "style.css", code: "a { color: red }" },
  ];
</script>

<CodeSnippet
  type="multi"
  {files}
  bind:selectedId
  on:change={(event) => onChange(event.detail)}
/>
<p data-testid="bound">{selectedId}</p>
