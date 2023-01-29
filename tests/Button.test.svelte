<script lang="ts">
  import { Button } from "../package";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<Button>Primary button</Button>

<Button kind="secondary">Secondary button</Button>

<Button kind="tertiary">Tertiary button</Button>

<Button kind="ghost">Ghost button</Button>

<Button kind="danger">Danger button</Button>

<Button kind="danger-tertiary">Danger tertiary button</Button>

<Button kind="danger-ghost">Danger ghost button</Button>

<Button icon="{Add}">With icon</Button>

<Button
  icon="{Add}"
  tooltipPosition="bottom"
  tooltipAlignment="center"
  iconDescription="Tooltip text"
/>

<Button href="#">Link button</Button>

<Button size="field">Primary</Button>

<Button size="field" kind="secondary">Secondary</Button>

<Button size="field" kind="tertiary">Tertiary</Button>

<Button size="field" kind="ghost">Ghost</Button>

<Button size="field" kind="danger">Danger</Button>

<Button size="small">Primary</Button>

<Button size="small" kind="secondary">Secondary</Button>

<Button size="small" kind="tertiary">Tertiary</Button>

<Button size="small" kind="ghost">Ghost</Button>

<Button size="small" kind="danger">Danger</Button>

<Button disabled>Disabled button</Button>

<Button skeleton />

<Button skeleton size="field" />

<Button skeleton size="small" />
