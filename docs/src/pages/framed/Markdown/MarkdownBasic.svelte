<script>
  import { Markdown } from "carbon-components-svelte";

  const source = `## Rolling back the billing-api release

The 4.12 release raised the p95 latency of \`POST /v1/invoices\` from 180 ms to **2.4 s**. To roll it back:

1. Open the [deployment dashboard](https://deploy.example.com/billing-api).
2. Pick the last healthy release, *4.11.3*.
3. Confirm the rollback, then watch the error rate:
   - it should fall under 0.5% within five minutes
   - if it doesn't, page the on-call engineer

> Rollbacks don't undo database migrations. Check the migration notes first.

| Release | p95 latency | Error rate |
| :------ | ----------: | ---------: |
| 4.11.3 | 180 ms | 0.2% |
| 4.12.0 | 2.4 s | 3.1% |`;
</script>

<Markdown {source} />
