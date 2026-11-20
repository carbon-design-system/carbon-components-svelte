<script>
  import { Button, KeyValueEditor, Stack } from "carbon-components-svelte";

  let rows = [
    { key: "REGION", value: "eu-de", secret: false, stored: false },
    { key: "STRIPE_SECRET_KEY", value: "", secret: true, stored: true },
    { key: "WEBHOOK_SECRET", value: "", secret: true, stored: true },
  ];
  let saved = "";

  async function save() {
    // For demo purposes only: a real app sends the new values to its server.
    await new Promise((resolve) => setTimeout(resolve, 300));
    saved = JSON.stringify(
      rows.filter((row) => !row.stored).map((row) => row.key),
    );
    // After a save, a secret goes back to the server and the page keeps only a mask.
    rows = rows.map((row) =>
      row.secret ? { ...row, value: "", stored: true } : row,
    );
  }
</script>

<Stack gap={5}>
  <KeyValueEditor
    bind:rows
    format="env"
    columns={["secret"]}
    labelText="Environment variables"
    helperText="Stored secrets cannot be read again. Replace one to change it."
  />
  <Button on:click={save}>Save</Button>
  <p>Sent in the last save: {saved || "nothing yet"}</p>
</Stack>
