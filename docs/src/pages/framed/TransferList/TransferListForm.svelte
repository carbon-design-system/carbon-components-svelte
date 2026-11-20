<script>
  import { Button, Stack, TransferList } from "carbon-components-svelte";

  const items = [
    { id: "slack", text: "Slack" },
    { id: "email", text: "Email" },
    { id: "pager", text: "Pager" },
    { id: "sms", text: "SMS" },
    { id: "webhook", text: "Webhook" },
    { id: "teams", text: "Microsoft Teams" },
  ];

  let submitted = "";
</script>

<form
  on:submit|preventDefault={(event) => {
    const data = new FormData(event.currentTarget);
    submitted = data.getAll("channels").join(" > ");
  }}
>
  <Stack gap={5}>
    <TransferList
      {items}
      name="channels"
      required
      selectedIds={["email"]}
      legendText="Escalation channels"
      helperText="Channels are tried in the order the selected list shows."
    />
    <Stack orientation="horizontal" gap={3}>
      <Button type="submit">Save</Button>
      <Button type="reset" kind="secondary">Reset</Button>
    </Stack>
    <p>Submitted: {submitted || "nothing yet"}</p>
  </Stack>
</form>
