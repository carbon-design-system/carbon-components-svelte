<script>
  import {
    ActionSet,
    Button,
    Dropdown,
    FluidForm,
    InlineLoading,
    InlineNotification,
    Stack,
    TextArea,
    TextInput,
  } from "carbon-components-svelte";

  const regions = [
    { id: "us-east", text: "US East (Washington DC)" },
    { id: "eu-de", text: "EU Germany (Frankfurt)" },
  ];

  /**
   * Stand-in for a SvelteKit form action: reads FormData, validates on the
   * "server", and returns either the errors with the submitted values or a
   * success result.
   * @param {FormData} data
   */
  async function createAppAction(data) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const name = String(data.get("name") ?? "").trim();
    const region = String(data.get("region") ?? "");
    const description = String(data.get("description") ?? "");

    /** @type {Record<string, string>} */
    const errors = {};
    if (!/^[a-z][a-z0-9-]{2,}$/.test(name)) {
      errors.name = "Use 3 or more lowercase letters, numbers, or dashes.";
    }
    if (region === "") errors.region = "Choose a deployment region.";

    if (Object.keys(errors).length > 0) {
      return {
        type: "failure",
        data: { values: { name, region, description }, errors },
      };
    }
    return { type: "success", data: { created: name } };
  }

  /** The action result, like SvelteKit's `form` prop. */
  let form = null;
  /** Dropdown does not restore itself on reset, so track it and clear it in `on:reset`. */
  let region = undefined;
  let submitting = false;

  $: values = form?.type === "failure" ? form.data.values : {};
  $: errors = form?.type === "failure" ? form.data.errors : {};
</script>

<FluidForm
  id="fluid-form-server-validation"
  novalidate
  on:reset={() => (region = undefined)}
  on:submit={async (e) => {
    e.preventDefault();
    const formElement = e.currentTarget;
    submitting = true;
    form = await createAppAction(new FormData(formElement));
    submitting = false;
    if (form.type === "success") formElement.reset();
  }}
>
  <TextInput
    name="name"
    labelText="Application name"
    placeholder="customer-portal"
    value={values.name ?? ""}
    invalid={!!errors.name}
    invalidText={errors.name}
  />
  <Dropdown
    name="region"
    labelText="Deployment region"
    label="Choose a region"
    items={regions}
    bind:selectedId={region}
    invalid={!!errors.region}
    invalidText={errors.region}
  />
  <TextArea
    name="description"
    labelText="Description (optional)"
    value={values.description ?? ""}
  />
</FluidForm>

<Stack gap={5}>
  {#if form?.type === "success"}
    <InlineNotification
      kind="success"
      title="Application created"
      subtitle={`${form.data.created} is being deployed.`}
      hideCloseButton
    />
  {/if}
  <ActionSet size="lg">
    <Button kind="secondary" type="reset" form="fluid-form-server-validation">
      Reset
    </Button>
    <Button
      type="submit"
      form="fluid-form-server-validation"
      disabled={submitting}
    >
      {#if submitting}
        <InlineLoading description="Creating..." />
      {:else}
        Create application
      {/if}
    </Button>
  </ActionSet>
</Stack>
