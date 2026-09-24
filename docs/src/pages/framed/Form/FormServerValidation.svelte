<script>
  import {
    Button,
    Form,
    InlineLoading,
    InlineNotification,
    Stack,
    TextInput,
  } from "carbon-components-svelte";

  /**
   * Stand-in for a SvelteKit form action: reads FormData, validates on the
   * "server", and returns either the errors with the submitted values or a
   * success result.
   * @param {FormData} data
   */
  async function inviteAction(data) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const email = String(data.get("email") ?? "").trim();
    const seatsRaw = String(data.get("seats") ?? "");
    const seats = seatsRaw === "" ? Number.NaN : Number(seatsRaw);

    /** @type {Record<string, string>} */
    const errors = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errors.email = "Enter an email address like name@example.com.";
    }
    if (!Number.isInteger(seats) || seats < 1 || seats > 50) {
      errors.seats = "Choose between 1 and 50 seats.";
    }

    if (Object.keys(errors).length > 0) {
      return {
        type: "failure",
        data: { values: { email, seats: seatsRaw }, errors },
      };
    }
    return { type: "success", data: { invited: email } };
  }

  /** The action result, like SvelteKit's `form` prop. */
  let form = null;
  let submitting = false;

  $: values = form?.type === "failure" ? form.data.values : {};
  $: errors = form?.type === "failure" ? form.data.errors : {};
</script>

<Form
  novalidate
  on:submit={async (e) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    submitting = true;
    form = await inviteAction(new FormData(formElement));
    submitting = false;
    // Like `use:enhance`, reset only after a successful submission.
    if (form.type === "success") formElement.reset();
  }}
>
  <Stack gap={5}>
    <TextInput
      name="email"
      type="email"
      labelText="Email"
      value={values.email ?? ""}
      invalid={!!errors.email}
      invalidText={errors.email}
    />
    <TextInput
      name="seats"
      type="number"
      labelText="Seats"
      placeholder="1–50"
      value={values.seats ?? ""}
      invalid={!!errors.seats}
      invalidText={errors.seats}
    />
    {#if form?.type === "success"}
      <InlineNotification
        kind="success"
        title="Invitation sent"
        subtitle={`We emailed ${form.data.invited}.`}
        hideCloseButton
      />
    {/if}
    <Button type="submit" disabled={submitting}>
      {#if submitting}
        <InlineLoading description="Sending..." />
      {:else}
        Send invite
      {/if}
    </Button>
  </Stack>
</Form>
