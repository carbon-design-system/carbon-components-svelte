<script context="module">
  const wait = (ms, signal) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      });
    });

  /** The fields of the "Create cloud instance" form. */
  export const fields = [
    {
      name: "basics",
      type: "object",
      label: "Basics",
      columns: 2,
      fields: [
        {
          name: "name",
          label: "Instance name",
          helperText: "Lowercase letters, numbers and dashes.",
          required: true,
          minLength: 3,
          maxLength: 40,
          pattern: "^[a-z][a-z0-9-]*$",
          // Checked on the server in a real app. `signal` aborts the check
          // when the user types again.
          validate: async (value, _values, { signal }) => {
            await wait(300, signal);
            return value === "taken"
              ? "That name is already in use"
              : undefined;
          },
        },
        {
          name: "owner",
          type: "email",
          label: "Owner email",
          required: true,
        },
        {
          name: "region",
          type: "dropdown",
          label: "Region",
          placeholder: "Choose a region",
          required: true,
          options: [
            { value: "us-south", label: "Dallas (us-south)" },
            { value: "eu-de", label: "Frankfurt (eu-de)" },
            { value: "jp-tok", label: "Tokyo (jp-tok)" },
          ],
        },
        {
          name: "project",
          type: "combobox",
          label: "Project",
          placeholder: "Search projects",
          options: ["Checkout", "Search", "Billing", "Internal tools"],
        },
        {
          name: "environment",
          type: "radio",
          label: "Environment",
          default: "dev",
          options: [
            { value: "dev", label: "Development" },
            { value: "stage", label: "Staging" },
            { value: "prod", label: "Production" },
          ],
        },
        {
          name: "description",
          type: "textarea",
          label: "Description",
          maxLength: 200,
        },
        { name: "labels", type: "tags", label: "Labels" },
      ],
    },
    {
      name: "compute",
      type: "object",
      label: "Compute",
      columns: 2,
      fields: [
        {
          name: "family",
          type: "togglebuttons",
          label: "Family",
          props: { selectionMode: "single" },
          options: ["General", "Compute", "Memory"],
          default: ["General"],
        },
        {
          name: "size",
          type: "select",
          label: "Size",
          required: true,
          options: [
            { value: "s", label: "Small (2 vCPU)" },
            { value: "m", label: "Medium (4 vCPU)" },
            { value: "l", label: "Large (8 vCPU)" },
          ],
        },
        {
          name: "vcpu",
          type: "slider",
          label: "vCPU limit",
          min: 1,
          max: 64,
          default: 4,
        },
        {
          name: "memory",
          type: "number",
          label: "Memory (GB)",
          min: 1,
          max: 512,
          default: 8,
          warn: (value) =>
            value != null && value < 2
              ? "Under 2 GB can be unstable"
              : undefined,
        },
        { name: "gpu", type: "toggle", label: "Attach a GPU" },
        {
          name: "gpuModel",
          type: "dropdown",
          label: "GPU model",
          required: true,
          visibleIf: { field: "gpu", equals: true },
          options: ["L4", "A100", "H100"],
        },
        {
          name: "gpuCount",
          type: "integer",
          label: "GPUs",
          min: 1,
          max: 8,
          default: 1,
          visibleIf: { field: "gpu", equals: true },
        },
      ],
    },
    {
      name: "storage",
      type: "object",
      label: "Storage",
      fields: [
        {
          name: "bootDisk",
          type: "number",
          label: "Boot disk (GB)",
          min: 10,
          max: 2000,
          default: 100,
        },
        {
          name: "disks",
          type: "array",
          label: "Data disks",
          addLabel: "Add data disk",
          itemLabel: "Disk",
          maxItems: 4,
          items: {
            columns: 3,
            fields: [
              {
                name: "size",
                type: "number",
                label: "Size (GB)",
                required: true,
                min: 1,
              },
              {
                name: "kind",
                type: "select",
                label: "Type",
                default: "ssd",
                options: [
                  { value: "ssd", label: "SSD" },
                  { value: "hdd", label: "HDD" },
                ],
              },
              { name: "encrypted", type: "checkbox", label: "Encrypted" },
            ],
          },
        },
        { name: "backup", type: "toggle", label: "Daily backup" },
        {
          name: "backupTime",
          type: "time",
          label: "Backup time (UTC)",
          required: true,
          visibleIf: { field: "backup", equals: true },
        },
        {
          name: "retention",
          type: "rangeslider",
          label: "Keep between (days)",
          min: 1,
          max: 90,
          default: [7, 30],
          visibleIf: { field: "backup", equals: true },
        },
      ],
    },
    {
      name: "network",
      type: "object",
      label: "Networking",
      fields: [
        {
          name: "vpc",
          type: "select",
          label: "VPC",
          options: ["default", "prod-vpc", "stage-vpc"],
          default: "default",
        },
        {
          name: "subnets",
          type: "multiselect",
          label: "Subnets",
          placeholder: "Choose subnets",
          options: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"],
        },
        { name: "publicIp", type: "checkbox", label: "Assign a public IP" },
        {
          name: "firewall",
          type: "checkboxes",
          label: "Open ports",
          options: [
            { value: 22, label: "SSH (22)" },
            { value: 80, label: "HTTP (80)" },
            { value: 443, label: "HTTPS (443)" },
          ],
        },
        {
          name: "cidrs",
          type: "array",
          label: "Allowed CIDR ranges",
          addLabel: "Add range",
          itemLabel: "Range",
          items: {
            type: "text",
            label: "CIDR",
            placeholder: "10.0.0.0/16",
            pattern: "^\\d{1,3}(\\.\\d{1,3}){3}/\\d{1,2}$",
          },
        },
      ],
    },
    {
      name: "access",
      type: "object",
      label: "Access",
      columns: 2,
      fields: [
        {
          name: "adminPassword",
          type: "password",
          label: "Admin password",
          required: true,
          minLength: 12,
        },
        {
          name: "confirmPassword",
          type: "password",
          label: "Confirm password",
          required: true,
          dependsOn: ["adminPassword"],
          validate: (value, values) =>
            value === values.access.adminPassword
              ? undefined
              : "The passwords do not match",
        },
        {
          name: "sshKey",
          type: "file",
          label: "SSH public key",
          helperText: "Optional. A .pub file.",
          props: { accept: [".pub"], multiple: false },
        },
        { name: "pin", type: "pin", label: "Recovery PIN", maxLength: 4 },
        { name: "expires", type: "date", label: "Expires on" },
        {
          name: "maintenance",
          type: "daterange",
          label: "Maintenance window",
          props: { endLabel: "Maintenance window end" },
        },
        { name: "priority", type: "rating", label: "Priority" },
        {
          name: "image",
          type: "search",
          label: "Boot image",
          placeholder: "Search images",
        },
      ],
    },
  ];
</script>

<script>
  import { CodeSnippet, SchemaForm, Stack } from "carbon-components-svelte";

  let submitted;
</script>

<Stack gap={6}>
  <SchemaForm
    {fields}
    initialValues={{ basics: { owner: "ada@example.com" } }}
    optionalMark
    on:submit={(event) => (submitted = JSON.stringify(event.detail, null, 2))}
    on:reset={() => (submitted = undefined)}
  />
  {#if submitted}
    <CodeSnippet type="multi" code={submitted} />
  {/if}
</Stack>
