<script>
  import { Button } from "carbon-components-svelte";
  import Add16 from "carbon-icons-svelte/lib/Add16";
</script>

<div>
  <h4>Buttons</h4>
  <Button
    {...$$props}
    kind="primary"
    on:click={() => console.log('click')}
    on:mouseover={() => console.log('mouseover')}
    on:mouseenter={() => console.log('mouseenter')}
    on:mouseleave={() => console.log('mouseleave')}>
    Primary button
  </Button>

  <Button {...$$props} kind="secondary">Secondary button</Button>

  <Button {...$$props} kind="tertiary">Tertiary button</Button>

  <Button {...$$props} kind="ghost">Ghost button</Button>

  <Button {...$$props} kind="danger">Danger button</Button>
</div>

<div>
  <h4>Buttons with Icons</h4>
  <Button {...$$props} kind="primary" icon={Add16}>Primary</Button>

  <Button {...$$props} kind="secondary" icon={Add16}>Secondary</Button>

  <Button {...$$props} kind="tertiary" icon={Add16}>Tertiary</Button>

  <Button {...$$props} kind="ghost" icon={Add16}>Ghost</Button>

  <Button {...$$props} kind="danger" icon={Add16}>Danger</Button>
</div>

<div>
  <h4>Icon-only Buttons</h4>
  <Button
    {...$$props}
    kind="primary"
    hasIconOnly
    icon={Add16}
    iconDescription="Primary"
    tooltipPosition="bottom"
    tooltipAlignment="center" />

  <Button
    {...$$props}
    kind="secondary"
    hasIconOnly
    icon={Add16}
    iconDescription="Secondary"
    tooltipPosition="bottom"
    tooltipAlignment="center" />

  <Button
    {...$$props}
    kind="tertiary"
    hasIconOnly
    icon={Add16}
    iconDescription="Tertiary"
    tooltipPosition="bottom"
    tooltipAlignment="center" />

  <Button
    {...$$props}
    kind="ghost"
    hasIconOnly
    icon={Add16}
    iconDescription="Ghost"
    tooltipPosition="bottom"
    tooltipAlignment="center" />

  <Button
    {...$$props}
    kind="danger"
    hasIconOnly
    icon={Add16}
    iconDescription="Danger"
    tooltipPosition="bottom"
    tooltipAlignment="center" />
</div>
