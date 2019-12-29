<script>
  export let story = undefined;

  import { cx } from '../../lib';
  import Layout from '../../internal/ui/Layout.svelte';
  import Button from './Button.svelte';
  import ButtonSkeleton from './Button.Skeleton.svelte';
  import Add16 from 'carbon-icons-svelte/lib/Add16';

  const {
    kind,
    disabled,
    size,
    iconDescription,
    small,
    tooltipPosition,
    tooltipAlignment
  } = $$props;

  const regularProps = {
    kind,
    disabled,
    size,
    iconDescription,
    small
  };

  const iconOnlyProps = {
    kind,
    disabled,
    size,
    icon: Add16,
    iconDescription,
    tooltipPosition,
    tooltipAlignment
  };

  const setProps = { disabled, small, size, iconDescription };
</script>

<Layout>
  <div>
    {#if story === 'skeleton'}
      <ButtonSkeleton />
      &nbsp;
      <ButtonSkeleton href="#" />
      &nbsp;
      <ButtonSkeleton small />
    {:else if story === 'inline'}
      <Button />
    {:else if story === 'icon-only buttons'}
      <Button {...iconOnlyProps} />
    {:else if story === 'set of buttons'}
      <div class={cx('--btn-set')}>
        <Button kind="secondary" {...setProps}>Secondary button</Button>
        <Button kind="primary" {...setProps}>Primary button</Button>
      </div>
    {:else}
      <Button {...regularProps}>Button</Button>
      &nbsp;
      <Button {...regularProps} href="#">Link</Button>
      &nbsp;
      <Button {...regularProps} as let:props>
        <p {...props}>Element</p>
      </Button>
      &nbsp;
      <Button {...regularProps} as let:props>
        <!-- svelte-ignore a11y-missing-attribute -->
        <a {...props}>Custom component</a>
      </Button>
    {/if}
  </div>
</Layout>
