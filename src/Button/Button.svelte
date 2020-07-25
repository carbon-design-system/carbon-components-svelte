<script>
  export let as = undefined;
  export let skeleton = false;
  export let disabled = false;
  export let href = undefined;
  export let icon = undefined;
  export let iconDescription = undefined;
  export let hasIconOnly = false;
  export let kind = "primary";
  export let size = "default";
  export let tabindex = "0";
  export let tooltipAlignment = undefined;
  export let tooltipPosition = undefined;
  export let type = "button";
  export let ref = null;

  import { getContext } from "svelte";
  import ButtonSkeleton from "./Button.Skeleton.svelte";

  const ctx = getContext("ComposedModal");

  $: if (ctx && ref) {
    ctx.declareRef(ref);
  }
  $: buttonProps = {
    role: "button",
    type: href && !disabled ? undefined : type,
    tabindex,
    disabled,
    href,
    ...$$restProps,
    class: [
      "bx--btn",
      size === "field" && "bx--btn--field",
      size === "small" && "bx--btn--sm",
      kind && `bx--btn--${kind}`,
      disabled && "bx--btn--disabled",
      hasIconOnly && "bx--btn--icon-only",
      hasIconOnly && "bx--tooltip__trigger",
      hasIconOnly && "bx--tooltip--a11y",
      hasIconOnly && tooltipPosition && `bx--tooltip--${tooltipPosition}`,
      hasIconOnly &&
        tooltipAlignment &&
        `bx--tooltip--align-${tooltipAlignment}`,
      $$restProps.class,
    ]
      .filter(Boolean)
      .join(" "),
  };
</script>

{#if skeleton}
  <ButtonSkeleton
    {href}
    small={size === 'small'}
    {...$$restProps}
    style={hasIconOnly && 'width: 3rem;'}
    on:click
    on:mouseover
    on:mouseenter
    on:mouseleave />
{:else}
  {#if as}
    <slot props={buttonProps} />
  {:else if href && !disabled}
    <!-- svelte-ignore a11y-missing-attribute -->
    <a
      bind:this={ref}
      {...buttonProps}
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave>
      {#if hasIconOnly}
        <span class:bx--assistive-text={true}>{iconDescription}</span>
      {/if}
      <slot />
      {#if icon}
        <svelte:component
          this={icon}
          aria-hidden="true"
          class="bx--btn__icon"
          aria-label={iconDescription} />
      {/if}
    </a>
  {:else}
    <button
      bind:this={ref}
      {...buttonProps}
      on:click
      on:mouseover
      on:mouseenter
      on:mouseleave>
      {#if hasIconOnly}
        <span class:bx--assistive-text={true}>{iconDescription}</span>
      {/if}
      <slot />
      {#if icon}
        <svelte:component
          this={icon}
          aria-hidden="true"
          class="bx--btn__icon"
          aria-label={iconDescription} />
      {/if}
    </button>
  {/if}
{/if}
