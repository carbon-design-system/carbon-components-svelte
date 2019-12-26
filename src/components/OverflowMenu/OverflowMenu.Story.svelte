<script>
  export let story = undefined;

  import Layout from '../../internal/ui/Layout.svelte';
  import OverflowMenu from './OverflowMenu.svelte';
  import OverflowMenuItem from './OverflowMenuItem.svelte';

  let primaryFocus = true;
</script>

<Layout>
  <div style="padding-left: 6rem">
    {#if story === 'links'}
      <OverflowMenu
        {...$$props.menu}
        on:close={({ detail }) => {
          console.log('close', detail);
        }}>
        <OverflowMenuItem
          {...$$props.menuItem}
          href="https://ibm.com"
          text="Option 1"
          bind:primaryFocus />
        <OverflowMenuItem
          {...$$props.menuItem}
          href="https://ibm.com"
          text="Option 2 is an example of a really long string and how we recommend handling this"
          requireTitle />
        <OverflowMenuItem {...$$props.menuItem} href="https://ibm.com" text="Option 3" disabled />
        <OverflowMenuItem {...$$props.menuItem} href="https://ibm.com" text="Option 4" />
        <OverflowMenuItem
          {...$$props.menuItem}
          href="https://ibm.com"
          text="Danger option"
          danger />
      </OverflowMenu>
    {:else if story === 'trigger'}
      <OverflowMenu
        {...$$props.menu}
        on:close={({ detail }) => {
          console.log('close', detail);
        }}
        style="width: auto">
        <div slot="menu" style="padding: 0 1rem">Menu</div>
        <OverflowMenuItem {...$$props.menuItem} text="Option 1" bind:primaryFocus />
        <OverflowMenuItem
          {...$$props.menuItem}
          text="Option 2 is an example of a really long string and how we recommend handling this"
          requireTitle />
        <OverflowMenuItem {...$$props.menuItem} text="Option 3" disabled />
        <OverflowMenuItem {...$$props.menuItem} text="Option 4" />
        <OverflowMenuItem {...$$props.menuItem} text="Danger option" danger />
      </OverflowMenu>
    {:else}
      <OverflowMenu
        {...$$props.menu}
        on:close={({ detail }) => {
          console.log('close', detail);
        }}>
        <OverflowMenuItem {...$$props.menuItem} text="Option 1" bind:primaryFocus />
        <OverflowMenuItem
          {...$$props.menuItem}
          text="Option 2 is an example of a really long string and how we recommend handling this"
          requireTitle />
        <OverflowMenuItem {...$$props.menuItem} text="Option 3" disabled />
        <OverflowMenuItem {...$$props.menuItem} text="Option 4" />
        <OverflowMenuItem {...$$props.menuItem} text="Danger option" danger />
      </OverflowMenu>
    {/if}

  </div>
</Layout>
