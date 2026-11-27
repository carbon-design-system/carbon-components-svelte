<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import { highlightCode } from "carbon-components-svelte/syntax";

  // A diff's marker column is not part of the text, so the highlighter
  // reads the code, in its own language, not the diff.
  const code = ` export function save(items) {
-  const total = items.length;
+  const total = items.filter(Boolean).length;
   return total > 0 ? total : null;
 }`;
</script>

<div use:highlightCode={"ts"}>
  <CodeSnippet type="multi" {code} diff lineNumbers highlightLines="4" />
</div>
