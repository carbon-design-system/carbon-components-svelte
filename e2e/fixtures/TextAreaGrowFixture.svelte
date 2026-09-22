<script>
  import { TextArea } from "carbon-components-svelte";

  const sixLines = Array.from({ length: 6 }, (_, i) => `Line ${i + 1}`).join(
    "\n",
  );
  const twentyLines = Array.from(
    { length: 20 },
    (_, i) => `Line ${i + 1}`,
  ).join("\n");
  const longLine =
    "This is a single long line of text that will wrap onto more visual lines as the surrounding container gets narrower, which should grow the measured height of the textarea.";
</script>

<div style="width: 400px;">
  <TextArea
    data-testid="grow-rows"
    grow
    rows={2}
    labelText="Grow rows"
    value={sixLines}
  />
</div>

<div style="width: 400px;">
  <TextArea
    data-testid="grow-max-rows"
    grow
    maxRows={8}
    labelText="Grow max rows"
    value={twentyLines}
  />
</div>

<div id="width-container" style="width: 600px;">
  <TextArea
    data-testid="grow-width"
    grow
    labelText="Grow width"
    value={longLine}
  />
</div>
