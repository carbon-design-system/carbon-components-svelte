<script lang="ts">
  import BadgeIndicator from "carbon-components-svelte/BadgeIndicator/BadgeIndicator.svelte";
  import Button from "carbon-components-svelte/Button/Button.svelte";
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

<Button
  data-testid="btn-icon-portal"
  icon={Add}
  portalTooltip
  tooltipPosition="top"
  tooltipAlignment="center"
  iconDescription="Portal tooltip text"
/>

<Button
  data-testid="btn-icon-no-description"
  icon={Add}
  aria-label="Custom accessible name"
/>

<Button href="#">Link button</Button>

<Button href="https://example.com" target="_blank">External link</Button>

<Button as let:props> <p {...props}>Custom element</p> </Button>

<Button disabled>Disabled button</Button>

<Button data-testid="btn-disabled-href" href="#" disabled>
  Disabled link button
</Button>

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

<div data-testid="badge-none">
  <Button kind="ghost" icon={Add} iconDescription="Notifications" />
</div>

<div data-testid="badge-dot">
  <Button kind="ghost" icon={Add} iconDescription="Notifications">
    <BadgeIndicator slot="badge" count={0} />
  </Button>
</div>

<div data-testid="badge-count">
  <Button kind="ghost" icon={Add} iconDescription="Notifications">
    <BadgeIndicator slot="badge" count={4} />
  </Button>
</div>

<div data-testid="badge-label">
  <Button kind="ghost" icon={Add} iconDescription="Notifications">
    <BadgeIndicator slot="badge" count="1.2K" />
  </Button>
</div>

<div data-testid="badge-size-override">
  <Button kind="ghost" size="small" icon={Add} iconDescription="Notifications">
    <BadgeIndicator slot="badge" count={4} />
  </Button>
</div>
