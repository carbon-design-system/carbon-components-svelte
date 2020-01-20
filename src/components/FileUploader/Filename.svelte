<script>
  let className = undefined;
  export { className as class };
  export let iconDescription = '';
  export let invalid = false;
  export let status = 'uploading';
  export let style = undefined;
  export let tabindex = '0';

  import Close16 from 'carbon-icons-svelte/lib/Close16';
  import CheckmarkFilled16 from 'carbon-icons-svelte/lib/CheckmarkFilled16';
  import WarningFilled16 from 'carbon-icons-svelte/lib/WarningFilled16';
  import { cx } from '../../lib';
  import Loading from '../Loading';
</script>

{#if status === 'uploading'}
  <Loading small description={iconDescription} withOverlay={false} class={className} {style} />
{/if}

{#if status === 'edit'}
  {#if invalid}
    <WarningFilled16 class={cx('--file-invalid')} />
  {/if}
  <Close16
    class={cx('--file-close', className)}
    aria-label={iconDescription}
    title={iconDescription}
    on:click
    on:keydown
    {tabindex}
    {style} />
{/if}

{#if status === 'complete'}
  <CheckmarkFilled16
    class={cx('--file-complete', className)}
    aria-label={iconDescription}
    title={iconDescription}
    {tabindex}
    {style} />
{/if}
