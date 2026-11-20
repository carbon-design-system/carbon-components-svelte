<script>
  import { CodeSnippet } from "carbon-components-svelte";

  const files = [
    {
      title: "App.svelte",
      code: `<h1>Hello {name}</h1>

<button on:click={() => count++}>{count}</button>`,
    },
    {
      title: "main.ts",
      code: `import App from "./App.svelte";

export default new App({ target: document.body });`,
    },
    {
      title: "package.json",
      code: `{
  "scripts": {
    "dev": "vite"
  }
}`,
    },
  ];

  let selectedIndex = 0;
</script>

<CodeSnippet type="multi" {files} bind:selectedIndex />
<p>Selected file: {files[selectedIndex].title}</p>
