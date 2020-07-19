<script>
  export let danger = false;
  export let disabled = false;
  export let hasDivider = false;
  export let href = "";
  export let primaryFocus = false;
  export let requireTitle = true;
  export let text = "Provide text";
  export let id = "ccs-" + Math.random().toString(36);
  export let ref = null;

  import { getContext, afterUpdate } from "svelte";

  const { focusedId, add, update, change } = getContext("OverflowMenu");

  add({ id, text, primaryFocus });

  afterUpdate(() => {
    if (primaryFocus) {
      ref.focus();
    }
  });

  $: primaryFocus = $focusedId === id;
  $: buttonProps = {
    tabindex: "-1",
    title: requireTitle ? text : undefined,
    class: "bx--overflow-menu-options__btn",
    disabled: href ? undefined : disabled,
    href: href ? href : undefined
  };
</script>

<li
  role="menuitem"
  class:bx--overflow-menu-options__option={true}
  class:bx--overflow-menu--divider={hasDivider}
  class:bx--overflow-menu-options__option--danger={danger}
  class:bx--overflow-menu-options__option--disabled={disabled}
  {...$$restProps}>
  {#if href}
    <!-- svelte-ignore a11y-missing-attribute -->
    <a
      bind:this={ref}
      {...buttonProps}
      on:click
      on:click={() => {
        update(id);
      }}
      on:keydown
      on:keydown={({ key }) => {
        if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        }
      }}>
      <slot>
        <div class:bx--overflow-menu-options__option-content={true}>{text}</div>
      </slot>
    </a>
  {:else}
    <button
      bind:this={ref}
      {...buttonProps}
      on:click
      on:click={() => {
        update(id);
      }}
      on:keydown
      on:keydown={({ key }) => {
        if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        }
      }}>
      <slot>
        <div class:bx--overflow-menu-options__option-content={true}>{text}</div>
      </slot>
    </button>
  {/if}
</li>
