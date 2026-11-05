<script lang="ts">
  import { CodeSnippet } from "carbon-components-svelte";
  import { highlightCode } from "carbon-components-svelte/syntax";
  import "carbon-components-svelte/css/syntax-tokens.css";
  import "carbon-components-svelte/css/syntax.css";

  const files = [
    {
      title: "App.svelte",
      code: `import Button from "./Button.svelte";\n\n<Button>Save</Button>`,
    },
    {
      title: "main.ts",
      code: `import App from "./App.svelte";\n\nnew App({ target: document.body });`,
    },
    {
      title: "long.txt",
      code: Array.from({ length: 24 }, (_, i) => `line ${i + 1}`).join("\n"),
    },
  ];

  const colored = [
    { title: "main.ts", code: `const a = 1;` },
    { title: "style.css", code: `a { color: red; }` },
  ];
  const languages: Record<string, string> = {
    "main.ts": "ts",
    "style.css": "css",
  };

  let selectedId = "App.svelte";
  let coloredId = "main.ts";
  let changes: string[] = [];
</script>

<div data-testid="title">
  <CodeSnippet
    type="multi"
    title="src/App.svelte"
    code={files[0].code}
    data-testid="snippet-title"
  />
</div>

<div data-testid="syntax" use:highlightCode={languages[coloredId]}>
  <CodeSnippet
    type="multi"
    files={colored}
    bind:selectedId={coloredId}
    data-testid="snippet-syntax"
  />
</div>

<div data-testid="files">
  <CodeSnippet
    type="multi"
    {files}
    bind:selectedId
    on:change={(event) => (changes = [...changes, event.detail.id])}
    data-testid="snippet-files"
  />
  <p data-testid="selected">{selectedId}</p>
  <p data-testid="changes">{changes.join(",")}</p>
</div>
