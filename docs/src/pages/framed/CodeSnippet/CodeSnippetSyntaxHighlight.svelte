<script>
  import { CodeSnippet } from "carbon-components-svelte";
  import Prism from "prismjs";
  import "prismjs/components/prism-typescript";

  const code = `export function isAdmin(role: string) {
  return role === 'admin';
}

export function isExpired(expiresAt: number) {
  return Date.now() > expiresAt;
}`;

  const highlighted = Prism.highlight(
    code,
    Prism.languages.typescript,
    "typescript",
  );
</script>

<CodeSnippet type="multi" {code}> {@html highlighted} </CodeSnippet>
