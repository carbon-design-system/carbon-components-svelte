<script>
  import { PeoplePicker } from "carbon-components-svelte";

  const directory = [
    { id: "u-1042", name: "Priya Raman", email: "priya.raman@example.com" },
    { id: "u-2290", name: "Marcus Oyelaran", email: "marcus@example.com" },
    { id: "u-3118", name: "Hannah Lindqvist", email: "hannah@example.com" },
    { id: "u-4501", name: "Tomás Herrera", email: "tomas@example.com" },
    { id: "u-5873", name: "Wei Zhang", email: "wei.zhang@example.com" },
  ];

  // Recent collaborators, as the app would keep them.
  const recent = directory.slice(0, 3);

  let value = [];
</script>

<PeoplePicker
  bind:value
  items={directory}
  suggestions={recent}
  minQueryLength={2}
  labelText="Share with"
  helperText="Press the down arrow for recent people. Search starts at two letters"
/>
