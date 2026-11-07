<script>
  import { CodeSnippet } from "carbon-components-svelte";

  // The first column of each line is the marker: "+", "-", or a space.
  const code = ` import { Button } from "carbon-components-svelte";

 export function save(items) {
-  const total = items.length;
+  const total = items.filter(Boolean).length;
   return total > 0 ? total : null;
 }`;
</script>

<CodeSnippet type="multi" {code} diff lineNumbers />
