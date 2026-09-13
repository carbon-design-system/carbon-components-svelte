<script>
  import { CodeSnippet } from "carbon-components-svelte";

  let code =
    "export function isAdmin(role: string) {\n  return role === 'admin';\n}\n\nexport function isExpired(expiresAt: number) {\n  return Date.now() > expiresAt;\n}\n\nexport function toPercent(value: number) {\n  return (value * 100).toFixed(1) + '%';\n}\n\nexport function maskSecret(value: string) {\n  return value.slice(0, 4) + '*'.repeat(Math.max(value.length - 8, 0)) + value.slice(-4);\n}";
</script>

<CodeSnippet type="multi" {code} feedback="Copied to clipboard" />
