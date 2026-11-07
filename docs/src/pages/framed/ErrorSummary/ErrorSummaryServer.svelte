<script>
  import {
    Button,
    ErrorSummary,
    Form,
    InlineNotification,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  /**
   * Stand-in for a SvelteKit form action: validates on the "server" and
   * returns the errors by field name with the submitted values.
   */
  async function inviteAction(data) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const email = String(data.get("email") ?? "").trim();
    const seats = Number(data.get("seats"));
    const errors = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errors.email = "Enter an email address like name@example.com";
    }
    if (!Number.isInteger(seats) || seats < 1 || seats > 50) {
      errors.seats = "Choose between 1 and 50 seats";
    }
    if (Object.keys(errors).length > 0) {
      return {
        type: "failure",
        values: { email, seats: data.get("seats") },
        errors,
      };
    }
    return { type: "success", email };
  }

  /** The action result, like SvelteKit's `form` prop. */
  let form = null;
  let summary;

  // Field names are the ids, so a link needs no lookup.
  $: errors = Object.entries(form?.errors ?? {}).map(([fieldId, message]) => ({
    fieldId,
    message,
  }));
  $: pageTitle = `${errors.length ? "Error: " : ""}Invite people`;
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<Form
  novalidate
  on:submit={async (e) => {
    e.preventDefault();
    form = await inviteAction(
      new FormData(/** @type {HTMLFormElement} */ (e.currentTarget)),
    );
    // Focus the summary on every failed submit, not only the first.
    summary?.focus();
  }}
>
  <Stack gap={6}>
    <ErrorSummary
      bind:this={summary}
      {errors}
      title={`Fix ${errors.length} ${errors.length === 1 ? "error" : "errors"}`}
    />
    {#if form?.type === "success"}
      <InlineNotification
        kind="success"
        title="Invitation sent"
        subtitle={`We emailed ${form.email}.`}
        hideCloseButton
      />
    {/if}
    <TextInput
      id="email"
      name="email"
      type="email"
      labelText="Email"
      value={form?.values?.email ?? ""}
      invalid={!!form?.errors?.email}
      invalidText={form?.errors?.email}
    />
    <TextInput
      id="seats"
      name="seats"
      type="number"
      labelText="Seats"
      placeholder="1-50"
      value={form?.values?.seats ?? ""}
      invalid={!!form?.errors?.seats}
      invalidText={form?.errors?.seats}
    />
    <Button type="submit">Send invite</Button>
  </Stack>
</Form>
