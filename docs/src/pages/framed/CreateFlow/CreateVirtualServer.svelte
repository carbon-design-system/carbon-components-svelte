<script>
  import {
    Button,
    Checkbox,
    Content,
    CreateFlowActions,
    CreateFlowForm,
    CreateFlowStep,
    CreateFlowSteps,
    createStepFlow,
    createUnsavedChanges,
    DescriptionList,
    DescriptionListItem,
    Dropdown,
    InlineNotification,
    NumberInput,
    RadioButton,
    RadioButtonGroup,
    Select,
    SelectItem,
    Tearsheet,
    TextInput,
    Toggle,
    UnsavedChangesPrompt,
  } from "carbon-components-svelte";

  const NAME = /^[a-z][a-z0-9-]{0,62}$/;

  const regions = [
    { id: "us-south", text: "Dallas (us-south)" },
    { id: "eu-de", text: "Frankfurt (eu-de)" },
    { id: "jp-tok", text: "Tokyo (jp-tok)" },
  ];

  const initial = () => ({
    name: "",
    region: "us-south",
    image: "ubuntu-24",
    boot: "block",
    vpc: "",
    subnet: "",
    publicIp: true,
    dataGb: 0,
    encrypt: false,
  });

  let open = true;
  let session = 0;
  let values = initial();
  let errors = {};

  // One store per dialog: a shared store would make unrelated dialogs prompt
  // each other.
  const unsaved = createUnsavedChanges();

  const flow = createStepFlow({
    steps: [
      { id: "details", label: "Details" },
      { id: "networking", label: "Networking" },
      { id: "storage", label: "Storage", optional: true },
      { id: "review", label: "Review" },
    ],
    validate,
    submit: createServer,
    unsavedChanges: unsaved,
  });

  // The "instance storage" boot option already includes a disk, so the
  // Storage step is skipped and drops out of the rail.
  $: flow.update("storage", { skipped: values.boot === "instance" });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // For demo purposes only: stands in for the requests behind each check.
  async function nameIsFree(name) {
    await delay(500);
    if (name.includes("offline")) {
      throw new Error("The naming service did not respond. Try again.");
    }
    return name !== "prod-web-1";
  }

  async function validate(step) {
    const next = {};
    errors = {};
    if (step.id === "details") {
      if (!values.name) {
        next.name = "Enter a name.";
      } else if (!NAME.test(values.name)) {
        next.name = "Use lowercase letters, numbers and hyphens.";
      } else if (!(await nameIsFree(values.name))) {
        next.name = `"${values.name}" is already in use.`;
      }
    } else if (step.id === "networking") {
      if (!values.vpc) next.vpc = "Choose a VPC.";
      if (!values.subnet) next.subnet = "Choose a subnet.";
    }
    errors = next;
    return Object.keys(next).length === 0;
  }

  async function createServer() {
    await delay(800);
    if (values.name === "fail-create") {
      throw new Error("The quota for this region is used up.");
    }
  }

  const guardClose = unsaved.closeGuard(() => {
    open = false;
  });

  function openFlow() {
    flow.reset();
    values = initial();
    errors = {};
    session += 1;
    open = true;
  }
</script>

<Content>
  <Button on:click={openFlow}>Create a virtual server</Button>
</Content>

<Tearsheet
  bind:open
  label="Virtual servers"
  title="Create a virtual server"
  description="Provision a server in a few steps."
  on:close={(event) => {
    // A request in flight can't be canceled, so keep the sheet open.
    if ($flow.busy) event.preventDefault();
    else guardClose(event);
  }}
>
  <svelte:fragment slot="influencer">
    <CreateFlowSteps {flow} />
  </svelte:fragment>

  {#key session}
    <CreateFlowForm {flow} unsavedChanges={unsaved}>
      <CreateFlowStep {flow} id="details">
        <TextInput
          labelText="Name"
          helperText="Lowercase letters, numbers and hyphens."
          data-modal-primary-focus
          bind:value={values.name}
          invalid={Boolean(errors.name)}
          invalidText={errors.name}
        />
        <Dropdown
          labelText="Region"
          items={regions}
          bind:selectedId={values.region}
        />
        <Select labelText="Operating system" bind:selected={values.image}>
          <SelectItem value="ubuntu-24" text="Ubuntu Linux 24.04" />
          <SelectItem value="rhel-9" text="Red Hat Enterprise Linux 9" />
          <SelectItem value="debian-12" text="Debian GNU/Linux 12" />
        </Select>
        <RadioButtonGroup legendText="Boot volume" bind:selected={values.boot}>
          <RadioButton value="block" labelText="Block storage" />
          <RadioButton
            value="instance"
            labelText="Instance storage (skips the Storage step)"
          />
        </RadioButtonGroup>
      </CreateFlowStep>

      <CreateFlowStep {flow} id="networking">
        <Select
          labelText="Virtual private cloud"
          bind:selected={values.vpc}
          invalid={Boolean(errors.vpc)}
          invalidText={errors.vpc}
        >
          <SelectItem value="" text="Choose a VPC" />
          <SelectItem value="vpc-prod" text="vpc-prod" />
          <SelectItem value="vpc-dev" text="vpc-dev" />
        </Select>
        <Select
          labelText="Subnet"
          bind:selected={values.subnet}
          invalid={Boolean(errors.subnet)}
          invalidText={errors.subnet}
        >
          <SelectItem value="" text="Choose a subnet" />
          <SelectItem value="10.240.0.0/24" text="10.240.0.0/24" />
          <SelectItem value="10.240.1.0/24" text="10.240.1.0/24" />
        </Select>
        <Toggle
          labelText="Public IP address"
          labelA="None"
          labelB="Attach a floating IP"
          bind:toggled={values.publicIp}
        />
      </CreateFlowStep>

      <CreateFlowStep {flow} id="storage">
        <NumberInput
          labelText="Data volume (GB)"
          helperText="Leave at 0 to add no data volume."
          min={0}
          max={2000}
          step={10}
          bind:value={values.dataGb}
        />
        <Checkbox
          labelText="Encrypt with a customer-managed key"
          bind:checked={values.encrypt}
        />
      </CreateFlowStep>

      <CreateFlowStep {flow} id="review">
        <DescriptionList layout="horizontal" gap={4}>
          <DescriptionListItem term="Name">{values.name}</DescriptionListItem>
          <DescriptionListItem term="Region">
            {regions.find((region) => region.id === values.region)?.text}
          </DescriptionListItem>
          <DescriptionListItem term="Operating system">
            {values.image}
          </DescriptionListItem>
          <DescriptionListItem term="Network">
            {values.vpc}, {values.subnet}
            {values.publicIp ? "with a floating IP" : "with no public IP"}
          </DescriptionListItem>
          <DescriptionListItem term="Storage">
            {values.boot === "instance"
              ? "Instance storage"
              : values.dataGb > 0
                ? `${values.dataGb} GB data volume`
                : "Boot volume only"}
          </DescriptionListItem>
        </DescriptionList>
      </CreateFlowStep>

      <svelte:fragment slot="submitted">
        <InlineNotification
          lowContrast
          fullWidth
          hideCloseButton
          kind="success"
          title="Server created"
          subtitle="{values.name} is provisioning. It is ready in a few minutes."
        />
      </svelte:fragment>
    </CreateFlowForm>
  {/key}

  <svelte:fragment slot="actions">
    <CreateFlowActions
      {flow}
      submitText="Create server"
      submittingDescription="Creating server"
      on:cancel={() => guardClose()}
      on:done={() => (open = false)}
    />
  </svelte:fragment>
</Tearsheet>

<!-- After the tearsheet, so the prompt opens over it. -->
<UnsavedChangesPrompt store={unsaved} />
