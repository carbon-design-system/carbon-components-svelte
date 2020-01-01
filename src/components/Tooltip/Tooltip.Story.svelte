<script>
  export let story = undefined;

  import OverflowMenuVertical16 from 'carbon-icons-svelte/lib/OverflowMenuVertical16';
  import Layout from '../../internal/ui/Layout.svelte';
  import { cx } from '../../lib';
  import Link from '../Link';
  import Button from '../Button';
  import Tooltip from './Tooltip.svelte';

  let open = story === 'uncontrolled';
</script>

<style>
  .custom-icon-class {
    width: 10px;
    height: 4px;
    border-radius: 5px;
    background-color: red;
  }
</style>

<Layout>
  <div style="margin: 3rem">
    {#if story === 'custom icon'}
      <Tooltip
        {...$$props}
        bind:open
        on:open={() => {
          console.log('on:open');
        }}
        on:close={() => {
          console.log('on:close');
        }}>
        <div slot="icon" class="custom-icon-class" />
        <p>
          This is some tooltip text. This box shows the maximum amount of text that should appear
          inside. If more room is needed please use a modal instead.
        </p>
        <div class={cx('--tooltip__footer')}>
          <Link href="/">Learn More</Link>
          <Button size="small">Create</Button>
        </div>
      </Tooltip>
    {:else if story === 'uncontrolled'}
      <Button
        style="padding: 15px 20px; margin: 4px 20px"
        on:click={() => {
          open = false;
        }}>
        Hide
      </Button>
      <Button
        style="padding: 15px 20px; margin: 4px 20px"
        on:click={() => {
          open = true;
        }}>
        Show
      </Button>
      <div style="padding: 15px 20px; margin: 4px 20px">
        <Tooltip {...$$props} bind:open hideIcon>
          <div slot="triggerText">My text wrapped with tooltip</div>
          Tooltip content
        </Tooltip>
      </div>
    {:else}
      <Tooltip
        {...$$props}
        bind:open
        on:open={() => {
          console.log('on:open');
        }}
        on:close={() => {
          console.log('on:close');
        }}
        icon={story === 'custom icon only' ? OverflowMenuVertical16 : undefined}>
        <p>
          This is some tooltip text. This box shows the maximum amount of text that should appear
          inside. If more room is needed please use a modal instead.
        </p>
        <div class={cx('--tooltip__footer')}>
          <Link href="/">Learn More</Link>
          <Button size="small">Create</Button>
        </div>
      </Tooltip>
    {/if}
  </div>
</Layout>
