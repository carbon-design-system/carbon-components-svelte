<script>
  import { Markdown } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";

  const source = `Retry a failed request with a growing delay:

\`\`\`ts
async function withRetry<T>(call: () => Promise<T>, attempts = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call();
    } catch (error) {
      if (attempt === attempts) throw error;
      // Wait 200 ms, 400 ms, 800 ms...
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
  }
}
\`\`\`

\`\`\`bash
curl -s https://api.example.com/v1/health | jq .status
\`\`\``;
</script>

<Markdown {source} highlight={tokenize} />
