<script lang="ts">
  import CodeSnippet from "carbon-components-svelte/CodeSnippet/CodeSnippet.svelte";

  export let onChange: (detail: {
    selectedIndex: number;
    title: string | undefined;
  }) => void = () => {};
  export let selectedIndex = 0;

  const files = [
    { title: "App.svelte", code: "<Button>Save</Button>" },
    { title: "main.ts", code: "new App();" },
    { title: "style.css", code: "a { color: red }" },
  ];
</script>

<CodeSnippet
  type="multi"
  {files}
  bind:selectedIndex
  on:change={(event) => onChange(event.detail)}
/>
<p data-testid="bound">{selectedIndex}</p>
