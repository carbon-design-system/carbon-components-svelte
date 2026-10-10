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

<style>
  /* Color Prism's token classes with the Carbon syntax tokens. */
  :global(.token.keyword) {
    color: var(--cds-syntax-keyword);
  }

  :global(.token.function) {
    color: var(--cds-syntax-function);
  }

  :global(.token.string) {
    color: var(--cds-syntax-string);
  }

  :global(.token.number),
  :global(.token.boolean) {
    color: var(--cds-syntax-number);
  }

  :global(.token.builtin),
  :global(.token.class-name) {
    color: var(--cds-syntax-type-name);
  }

  :global(.token.operator),
  :global(.token.punctuation) {
    color: var(--cds-syntax-punctuation);
  }

  :global(.token.comment) {
    color: var(--cds-syntax-comment);
  }
</style>
