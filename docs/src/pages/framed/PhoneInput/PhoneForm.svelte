<script>
  import { Button, PhoneInput, Stack } from "carbon-components-svelte";

  let submitted = "";

  /** @param {SubmitEvent} event */
  function onSubmit(event) {
    event.preventDefault();
    const data = new FormData(
      /** @type {HTMLFormElement} */ (event.currentTarget),
    );
    submitted = String(data.get("phone") ?? "");
  }
</script>

<form on:submit={onSubmit}>
  <Stack gap={5}>
    <PhoneInput labelText="Phone" name="phone" country="GB" />
    <Button type="submit">Save</Button>
  </Stack>
</form>
<p>Submitted: <code>{submitted || "(nothing yet)"}</code></p>
