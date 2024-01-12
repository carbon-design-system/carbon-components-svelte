<script lang="ts">
  import { Button } from "../types";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<Button data-test-id="btn">Primary button</Button>

<Button kind="secondary">Secondary button</Button>

<Button kind="tertiary">Tertiary button</Button>

<Button kind="ghost">Ghost button</Button>

<Button kind="danger">Danger button</Button>

<Button kind="danger--tertiary">Danger tertiary button</Button>

<Button kind="danger--ghost">Danger ghost button</Button>

<Button icon="{Add}">With icon</Button>

<Button
  icon="{Add}"
  tooltipPosition="bottom"
  tooltipAlignment="center"
  iconDescription="Tooltip text"
/>

<Button href="#">Link button</Button>

<Button as let:props>
  <p {...props}>Custom element</p>
</Button>

<Button size="md">Primary</Button>

<Button size="md" kind="secondary">Secondary</Button>

<Button size="md" kind="tertiary">Tertiary</Button>

<Button size="md" kind="ghost">Ghost</Button>

<Button size="md" kind="danger">Danger</Button>

<Button size="sm">Primary</Button>

<Button size="sm" kind="secondary">Secondary</Button>

<Button size="sm" kind="tertiary">Tertiary</Button>

<Button size="sm" kind="ghost">Ghost</Button>

<Button size="sm" kind="danger">Danger</Button>

<Button disabled>Disabled button</Button>

<Button skeleton />

<Button skeleton size="md" />

<Button skeleton size="sm" />
