<script>
  import KeyValueEditor from "carbon-components-svelte/KeyValueEditor/KeyValueEditor.svelte";
  import { onMount } from "svelte";

  const params = new URLSearchParams(window.location.search);
  const count = Number(params.get("rows") ?? 500);
  const secrets = params.get("secrets") === "1";

  const started = performance.now();
  let rows =
    params.get("blank") === "1"
      ? [{ key: "", value: "" }]
      : Array.from({ length: count }, (_, i) => ({
          key: `KEY_${i}`,
          value: `value ${i}`,
          ...(secrets && i % 5 === 0 ? { secret: true } : {}),
        }));

  onMount(() => {
    requestAnimationFrame(() => {
      window.__kvReadyMs = performance.now() - started;
    });
  });
</script>

<KeyValueEditor
  bind:rows
  id="stress"
  name="env"
  format="env"
  labelText="Variables"
  columns={secrets ? ["enabled", "secret"] : []}
/>
<p data-testid="count">{rows.length}</p>
