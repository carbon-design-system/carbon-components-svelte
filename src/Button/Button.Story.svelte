<script>
  export let story = undefined;

  import Button from "./Button.svelte";
  import ButtonSkeleton from "./Button.Skeleton.svelte";
  import ButtonSet from "./ButtonSet.svelte";
  import Add16 from "carbon-icons-svelte/lib/Add16";

  const {
    kind,
    disabled,
    size,
    iconDescription,
    small,
    tooltipPosition,
    tooltipAlignment,
    stacked,
  } = $$props;

  const regularProps = {
    kind,
    disabled,
    size,
    iconDescription,
    small,
  };

  const iconOnlyProps = {
    hasIconOnly: true,
    kind,
    disabled,
    size,
    icon: Add16,
    iconDescription,
    tooltipPosition,
    tooltipAlignment,
  };

  const setProps = { stacked, disabled, small, size, iconDescription };
</script>

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
    <ButtonSet stacked="{setProps.stacked}">
      <Button kind="ghost" {...setProps}>Ghost button</Button>
      <Button kind="secondary" {...setProps}>Secondary button</Button>
      <Button kind="primary" {...setProps}>Primary button</Button>
    </ButtonSet>
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
