<script>
  import { ActivityBody, Stack, TextArea } from "carbon-components-svelte";

  let body = `**Heads up:** the *staging* deploy is blocked by \`QA-412\`.

> Rollback is safe until 16:00

- Check https://example.com/runbooks/rollback
- Ask @[Priya Raman](priya) for the key

<img src=x onerror="alert('not run')"> and [a bad link](javascript:alert(1)) stay as text.`;
</script>

<Stack gap={5}>
  <TextArea bind:value={body} labelText="Comment source" rows={8} />
  <ActivityBody {body} />
</Stack>
