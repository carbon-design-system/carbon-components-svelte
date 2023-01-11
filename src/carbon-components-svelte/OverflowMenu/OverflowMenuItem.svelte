<script>
  /**
   * Specify the item text
   * Alternatively, use the default slot for a custom element
   */
  export let text = "Provide text";

  /** Specify the `href` attribute if the item is a link */
  export let href = "";

  /** Set to `true` if the item should be focused when opening the menu */
  export let primaryFocus = false;

  /** Set to `true` to disable the item */
  export let disabled = false;

  /** Set to `true` to include a divider */
  export let hasDivider = false;

  /** Set to `true` to use the danger variant */
  export let danger = false;

  /** Set to `false` to omit the button `title` attribute */
  export let requireTitle = true;

  /** Set an id for the top-level element */
  export let id = "ccs-" + Math.random().toString(36);

  /** Obtain a reference to the HTML element */
  export let ref = null;

  import { getContext, afterUpdate } from "svelte";

  const { focusedId, add, update, change } = getContext("OverflowMenu");

  add({ id, text, primaryFocus, disabled });

  afterUpdate(() => {
    if (ref && primaryFocus) {
      ref.focus();
    }
  });

  $: primaryFocus = $focusedId === id;
  $: buttonProps = {
    role: "menuitem",
    tabindex: "-1",
    class: "bx--overflow-menu-options__btn",
    disabled: href ? undefined : disabled,
    href: href ? href : undefined,
    title: requireTitle ? ($$slots.default ? undefined : text) : undefined,
  };
</script>

<li
  role="none"
  id="{id}"
  class:bx--overflow-menu-options__option="{true}"
  class:bx--overflow-menu--divider="{hasDivider}"
  class:bx--overflow-menu-options__option--danger="{danger}"
  class:bx--overflow-menu-options__option--disabled="{disabled}"
  {...$$restProps}
>
  {#if href}
    <!-- svelte-ignore a11y-missing-attribute -->
    <a
      bind:this="{ref}"
      {...buttonProps}
      on:click
      on:click="{() => {
        update(id);
      }}"
      on:keydown
      on:keydown="{({ key }) => {
        if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        }
      }}"
    >
      <slot>
        <div class:bx--overflow-menu-options__option-content="{true}">
          {text}
        </div>
      </slot>
    </a>
  {:else}
    <button
      bind:this="{ref}"
      {...buttonProps}
      on:click
      on:click="{() => {
        update(id);
      }}"
      on:keydown
      on:keydown="{({ key }) => {
        if (key === 'ArrowDown') {
          change(1);
        } else if (key === 'ArrowUp') {
          change(-1);
        }
      }}"
    >
      <slot>
        <div class:bx--overflow-menu-options__option-content="{true}">
          {text}
        </div>
      </slot>
    </button>
  {/if}
</li>
