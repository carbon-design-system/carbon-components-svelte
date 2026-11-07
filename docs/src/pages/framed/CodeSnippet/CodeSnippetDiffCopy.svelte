<script>
  import { CodeSnippet, Stack } from "carbon-components-svelte";

  const code = ` function save(items) {
-  const total = items.length;
+  const total = items.filter(Boolean).length;
   return total;
 }`;

  let copied = "Press a copy button.";
</script>

<Stack gap={5}>
  <CodeSnippet
    type="multi"
    {code}
    diff
    codeLabel="Diff that copies itself"
    copy={(text) => (copied = text)}
  />
  <CodeSnippet
    type="multi"
    {code}
    diff
    diffCopy="result"
    codeLabel="Diff that copies its result"
    copy={(text) => (copied = text)}
  />
  <CodeSnippet
    type="multi"
    code={copied}
    codeLabel="Copied text"
    hideCopyButton
  />
</Stack>
