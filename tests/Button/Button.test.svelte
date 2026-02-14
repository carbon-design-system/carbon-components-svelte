<script lang="ts">
  import { Button } from "carbon-components-svelte";
  import Add from "carbon-icons-svelte/lib/Add.svelte";
</script>

<Button>primary</Button>
<Button kind="secondary">secondary</Button>
<Button kind="tertiary">tertiary</Button>
<Button kind="ghost">ghost</Button>
<Button kind="danger">danger</Button>
<Button kind="danger-tertiary">danger-tertiary</Button>
<Button kind="danger-ghost">danger-ghost</Button>

<Button size="field">field size</Button>
<Button size="small">small size</Button>

<Button
  icon={Add}
  tooltipPosition="bottom"
  tooltipAlignment="center"
  iconDescription="Tooltip text"
/>

<Button
  data-testid="btn-icon-only-hide-tooltip"
  icon={Add}
  hideTooltip
  iconDescription="Add item"
/>

<Button href="#">Link button</Button>

<Button as let:props>
  <p {...props}>Custom element</p>
</Button>

<Button disabled>Disabled button</Button>

<Button icon={Add}>With icon</Button>

<Button
  data-testid="btn"
  on:click={() => {
    console.log("click");
  }}
>
  Test button
</Button>

<Button skeleton />
<Button skeleton size="field" />
<Button skeleton size="small" />

<Button
  data-testid="btn-icon-a"
  kind="ghost"
  icon={Add}
  iconDescription="Add"
/>
<Button
  data-testid="btn-icon-b"
  kind="ghost"
  icon={Add}
  iconDescription="Delete"
/>
<Button
  data-testid="btn-icon-c"
  kind="ghost"
  icon={Add}
  iconDescription="Save"
/>
