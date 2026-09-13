<script>
  import { CodeSnippet } from "carbon-components-svelte";

  let code =
    "export function isAdmin(role: string) {\n  return role === 'admin';\n}\n\nexport function isExpired(expiresAt: number) {\n  return Date.now() > expiresAt;\n}\n\nexport function toPercent(value: number) {\n  return (value * 100).toFixed(1) + '%';\n}\n\nexport function maskSecret(value: string) {\n  return value.slice(0, 4) + '*'.repeat(Math.max(value.length - 8, 0)) + value.slice(-4);\n}\n\nexport function isRateLimited(remaining: number) {\n  return remaining <= 0;\n}\n\nexport function toBackoffDelay(attempt: number) {\n  return Math.min(2 ** attempt * 1000, 30000);\n}\n\nexport function isStale(updatedAt: number, maxAgeMs: number) {\n  return Date.now() - updatedAt > maxAgeMs;\n}";
</script>

<CodeSnippet
  type="multi"
  {code}
  showMoreText="Expand"
  showLessText="Collapse"
/>
