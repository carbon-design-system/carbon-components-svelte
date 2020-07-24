<script>
  import { Button } from "carbon-components-svelte";
  import Add16 from "carbon-icons-svelte/lib/Add16";
</script>

<div>
  <Button
    data-test="button-primary"
    kind="primary"
    on:click={() => console.log('click')}
    on:mouseover={() => console.log('mouseover')}
    on:mouseenter={() => console.log('mouseenter')}
    on:mouseleave={() => console.log('mouseleave')}>
    Primary button
  </Button>
  <Button kind="secondary">Secondary button</Button>
  <Button kind="tertiary">Tertiary button</Button>
  <Button kind="ghost">Ghost button</Button>
  <Button kind="danger">Danger button</Button>
</div>
<div>
  <Button kind="primary" size="field">Primary button</Button>
  <Button kind="secondary" size="field">Secondary button</Button>
  <Button kind="tertiary" size="field">Tertiary button</Button>
  <Button kind="ghost" size="field">Ghost button</Button>
  <Button kind="danger" size="field">Danger button</Button>
</div>
<div>
  <Button kind="primary" size="small">Primary button</Button>
  <Button kind="secondary" size="small">Secondary button</Button>
  <Button kind="tertiary" size="small">Tertiary button</Button>
  <Button kind="ghost" size="small">Ghost button</Button>
  <Button kind="danger" size="small">Danger button</Button>
</div>
<div>
  <Button kind="primary" size="small" icon={Add16}>Primary button</Button>
  <Button kind="secondary" size="small" icon={Add16}>Secondary button</Button>
  <Button kind="tertiary" size="small" icon={Add16}>Tertiary button</Button>
  <Button kind="ghost" size="small" icon={Add16}>Ghost button</Button>
  <Button kind="danger" size="small" icon={Add16}>Danger button</Button>
</div>
