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
    id: "large-file",
    label: "Large file (2,000 lines)",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Tag } from "carbon-components-svelte";
  import { total } from "./generated.js";
${SCRIPT_END}

<Tag type="blue">total: {total}</Tag>
`,
      },
      {
        name: "generated.js",
        source: `${Array.from(
          { length: 1999 },
          (_, i) =>
            `export const value${i} = { id: "${i}", label: "Item ${i}", weight: ${i % 7} * 1.5 }; // row ${i}`,
        ).join("\n")}
export const total = ${Array.from({ length: 20 }, (_, i) => `value${i}.weight`).join(" + ")};
`,
      },
    ],
  },
  {
    id: "console",
    label: "Console inspector",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Button, Stack } from "carbon-components-svelte";

  const user = { name: "Ada", roles: ["admin", "editor"], meta: new Map([["since", 2019]]) };
  user.self = user;

  console.log("Mounted", user);
  console.info("%cStyled%c and plain", "color: #0f62fe; font-weight: 600", "");
  console.warn("Deprecated prop", { prop: "size", use: "kind" });
  console.table([
    { id: 1, name: "Slack", enabled: true },
    { id: 2, name: "Email", enabled: false },
  ]);
  console.group("Group");
  console.log("Inside the group", Array.from({ length: 250 }, (_, i) => i * i));
  console.groupEnd();
  console.time("work");
  for (let i = 0; i < 1e5; i++);
  console.timeEnd("work");

  let ticks = 0;
  setInterval(() => console.count("tick"), 2000);

  function boom() {
    throw new Error("Boom from a click handler");
  }
${SCRIPT_END}

<Stack gap={5}>
  <Button on:click={(e) => console.log("Clicked", e.currentTarget)}>Log the button element</Button>
  <Button kind="danger" on:click={boom}>Throw</Button>
  <Button kind="secondary" on:click={() => console.trace("Trace from a handler")}>Trace</Button>
</Stack>
`,
      },
    ],
  },
  {
    id: "state-stores",
    label: "State & stores in the console",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Button, Stack } from "carbon-components-svelte";
  import { writable } from "svelte/store";

  let todos = $state([{ text: "Write docs", done: false }]);
  let remaining = $derived(todos.filter((t) => !t.done).length);
  const theme = writable({ name: "g100", contrast: "high" });

  function add() {
    todos.push({ text: \`Task \${todos.length + 1}\`, done: false });
    console.log("todos", todos, "remaining", remaining);
  }
${SCRIPT_END}

<Stack gap={5}>
  <Button onclick={add}>Add a todo and log $state</Button>
  <Button kind="secondary" onclick={() => console.log("theme store", theme)}>Log a store</Button>
  <p>{remaining} remaining</p>
</Stack>
`,
      },
    ],
  },
  {
    id: "carbon-lint",
    label: "Carbon usage lint",
    files: [
      {
        name: "App.svelte",
        source: `<script>
  import { Tab, Tabs, Tag, TextInput } from "carbon-components-svelte";

  let value = "";
${SCRIPT_END}

<TextInput lableText="Name" bind:vlaue={value} on:chnage={() => {}} />

<Tag typ="red">Typo in a short prop name</Tag>

<Tab label="Outside its Tabs" />

<Tabs>
  <Tab label="Inside Tabs is fine" />
</Tabs>
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
