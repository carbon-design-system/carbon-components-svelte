<script>
  import {
    Accordion,
    AccordionItem,
    ToggleSmall,
    NumberInput,
    FormGroup
  } from 'carbon-components-svelte';
  import { ComponentPreview } from '../../Component';

  $: items = [1, 2, 3, 4].map(id => ({ id, open: false }));

  $: props = {
    count: 4,
    open: false,
    skeleton: false
  };

  $: if (props.skeleton) {
    items = items.map(_ => ({ ..._, open: false }));
  }

  $: code = `
<script>
  import { Accordion, AccordionItem } from 'carbon-components-svelte';
< /script>

<Accordion${props.skeleton ? ' skeleton' : ''}${props.skeleton ? ` count={${props.count}}` : ''}${
    props.open ? ` open` : ''
  }>
${items
  .map(item => {
    return `  <AccordionItem title="Item ${item.id}"${item.open ? ' open' : ''}>Item ${
      item.id
    } content</AccordionItem>`;
  })
  .join('\n')}
</Accordion>
  `;
</script>

<ComponentPreview {code} minHeight="16rem">
  <Accordion {...props}>
    {#each items as { id }, i (id)}
      <AccordionItem title={`Item ${id}`} bind:open={items[i].open}>
        Item {id} content
      </AccordionItem>
    {/each}
  </Accordion>
  <div slot="props">
    <FormGroup legendText="Skeleton">
      <ToggleSmall id="toggle-skeleton" bind:toggled={props.skeleton} />
    </FormGroup>
    <FormGroup legendText="Skeleton row count">
      <NumberInput disabled={!props.skeleton} bind:value={props.count} />
    </FormGroup>
    <FormGroup legendText="Skeleton first item open">
      <ToggleSmall id="toggle-open" disabled={!props.skeleton} bind:toggled={props.open} />
    </FormGroup>
  </div>
</ComponentPreview>
