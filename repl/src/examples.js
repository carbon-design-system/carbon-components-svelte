// Spike examples. Each exercises a different part of the pipeline.
const SCRIPT_END = "</" + "script>";

export const examples = [
  { id: "default", label: "Button + ComboBox + icon", files: null },
  {
    id: "datatable",
    label: "DataTable (sortable)",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { DataTable } from "carbon-components-svelte";

  const headers = [
    { key: "name", value: "Name" },
    { key: "protocol", value: "Protocol" },
    { key: "port", value: "Port" },
    { key: "rule", value: "Rule" },
  ];

  const rows = Array.from({ length: 8 }, (_, i) => ({
    id: String(i),
    name: \`Load Balancer \${i + 1}\`,
    protocol: i % 2 ? "HTTP" : "HTTPS",
    port: 3000 + i * 10,
    rule: i % 3 ? "Round robin" : "DNS delegation",
  }));
${SCRIPT_END}

<DataTable sortable title="Load balancers" description="Click a header to sort." {headers} {rows} />
`,
      },
    ],
  },
  {
    id: "modal",
    label: "Modal",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Button, Modal } from "carbon-components-svelte";

  let open = false;
${SCRIPT_END}

<Button on:click={() => (open = true)}>Create database</Button>

<Modal
  bind:open
  modalHeading="Create database"
  primaryButtonText="Confirm"
  secondaryButtonText="Cancel"
  on:click:button--secondary={() => (open = false)}
  on:submit={() => (open = false)}
>
  <p>Create a new Cloudant database in the US South region.</p>
</Modal>
`,
      },
    ],
  },
  {
    id: "datepicker",
    label: "DatePicker (range, flatpickr vendor)",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { DatePicker, DatePickerInput } from "carbon-components-svelte";

  let valueFrom = "";
  let valueTo = "";
${SCRIPT_END}

<DatePicker datePickerType="range" bind:valueFrom bind:valueTo>
  <DatePickerInput labelText="Start date" placeholder="mm/dd/yyyy" />
  <DatePickerInput labelText="End date" placeholder="mm/dd/yyyy" />
</DatePicker>

<p style="margin-top: 1rem">{valueFrom || "—"} → {valueTo || "—"}</p>
`,
      },
    ],
  },
  {
    id: "multi-file",
    label: "Multiple files",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Stack } from "carbon-components-svelte";
  import Counter from "./Counter.svelte";
  import { formatCount } from "./format.js";

  let total = 0;
${SCRIPT_END}

<Stack gap={5}>
  <Counter label="Apples" on:change={(e) => (total += e.detail)} />
  <Counter label="Pears" on:change={(e) => (total += e.detail)} />
  <p>Total: {formatCount(total)}</p>
</Stack>
`,
      },
      {
        name: "Counter.svelte",
        source: `<script>
  import { createEventDispatcher } from "svelte";
  import { Button } from "carbon-components-svelte";
  import { Add, Subtract } from "carbon-icons-svelte";

  export let label = "Count";

  const dispatch = createEventDispatcher();
  let count = 0;

  function step(delta) {
    count += delta;
    dispatch("change", delta);
  }
${SCRIPT_END}

<div style="display: flex; gap: 0.5rem; align-items: center">
  <Button kind="tertiary" size="small" iconDescription="Decrement" icon={Subtract} on:click={() => step(-1)} />
  <strong style="min-width: 6rem">{label}: {count}</strong>
  <Button kind="tertiary" size="small" iconDescription="Increment" icon={Add} on:click={() => step(1)} />
</div>
`,
      },
      {
        name: "format.js",
        source: `export function formatCount(n) {
  return new Intl.NumberFormat("en-US").format(n) + (n === 1 ? " item" : " items");
}
`,
      },
    ],
  },
  {
    id: "runes",
    label: "Svelte 5 runes",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Button, ProgressBar, Stack } from "carbon-components-svelte";

  let value = $state(20);
  let done = $derived(value >= 100);
${SCRIPT_END}

<Stack gap={5} style="max-width: 24rem">
  <ProgressBar {value} labelText="Upload" helperText={done ? "Done" : \`\${value}%\`} />
  <Button disabled={done} onclick={() => (value = Math.min(100, value + 20))}>Upload more</Button>
</Stack>
`,
      },
    ],
  },
  {
    id: "console",
    label: "Console + errors",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Button, Stack } from "carbon-components-svelte";

  console.log("Mounted", { at: new Date().toISOString(), nested: { list: [1, 2, 3] } });
  console.warn("This is a warning");

  const ticker = setInterval(() => console.info("tick (cleared on every re-run)"), 2000);
${SCRIPT_END}

<Stack gap={5}>
  <Button on:click={() => console.log("Clicked", new Map([["a", 1]]))}>Log</Button>
  <Button kind="danger" on:click={() => { throw new Error("Boom"); }}>Throw</Button>
  <Button kind="secondary" on:click={() => localStorage.setItem("k", "v") || console.log(localStorage.getItem("k"))}>
    localStorage shim
  </Button>
</Stack>
`,
      },
    ],
  },
  {
    id: "compile-error",
    label: "Compile error + blocked import",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Button } from "carbon-components-svelte";
  import confetti from "canvas-confetti";
${SCRIPT_END}

<Button>Previous preview stays visible while this fails</Button>
`,
      },
    ],
  },
];
