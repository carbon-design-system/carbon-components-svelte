<script>
  /**
   * Specify the tab label.
   * Alternatively, use the default slot.
   * @example
   * ```svelte
   * <Tab>
   *   <span>Label</span>
   * </Tab>
   * ```
   */
  export let label = "";

  /** Specify the href attribute */
  export let href = "#";

  /** Set to `true` to disable the tab */
  export let disabled = false;

  /** Specify the tabindex */
  export let tabindex = "0";

  /** Set an id for the top-level element */
  export let id = `ccs-${Math.random().toString(36)}`;

  /**
   * Specify the icon to render.
   * Icon is rendered to the right of the label by default.
   * When `Tabs.dismissible` is enabled, the icon is rendered to the left.
   * @type {any}
   */
  export let icon = undefined;

  /** Obtain a reference to the anchor HTML element */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import Close from "../icons/Close.svelte";

  const {
    selectedTab,
    useAutoWidth,
    useDismissible,
    add,
    remove,
    update,
    dismiss,
    change,
  } = getContext("carbon:Tabs");

  add({ id, label, disabled });

  onMount(() => {
    return () => {
      remove(id);
    };
  });

  $: selected = $selectedTab === id;
</script>

<!-- svelte-ignore a11y-mouse-events-have-key-events -->
<li
  tabindex="-1"
  role="presentation"
  class:bx--tabs__nav-item={true}
  class:bx--tabs__nav-item--disabled={disabled}
  class:bx--tabs__nav-item--selected={selected}
  {...$$restProps}
  on:click|preventDefault
  on:click|preventDefault={() => {
    if (!disabled) {
      update(id);
    }
  }}
  on:mouseover
  on:mouseenter
  on:mouseleave
  on:keydown={({ key }) => {
    if (!disabled) {
      if ($useDismissible && key === "Delete") {
        dismiss(id);
      } else if (key === "ArrowRight") {
        change(1);
      } else if (key === "ArrowLeft") {
        change(-1);
      } else if (key === " " || key === "Enter") {
        update(id);
      }
    }
  }}
>
  <a
    bind:this={ref}
    role="tab"
    tabindex={disabled ? "-1" : tabindex}
    aria-selected={selected}
    aria-disabled={disabled}
    {id}
    {href}
    class:bx--tabs__nav-link={true}
    style:width={
      $useAutoWidth
        ? "auto"
        : $useDismissible
          ? "calc(10rem - 1.5rem)"
          : undefined
    }
  >
    {#if $useDismissible && icon}
      <div class:bx--tabs__nav-item--icon-left={true}>
        <svelte:component this={icon} />
      </div>
    {/if}
    <slot>{label}</slot>
    {#if icon && !$useDismissible}
      <div class:bx--tabs__nav-item--icon={true}>
        <svelte:component this={icon} />
      </div>
    {/if}
  </a>
  {#if $useDismissible}
    <div class:bx--tabs__nav-item--close={true}>
      <button
        type="button"
        tabindex="-1"
        aria-label={label ? `Dismiss ${label}` : "Dismiss tab"}
        class:bx--tabs__nav-item--close-icon={true}
        class:bx--tabs__nav-item--close-icon--selected={selected}
        class:bx--tabs__nav-item--close-icon--disabled={disabled}
        {disabled}
        on:click|preventDefault|stopPropagation={() => {
          if (!disabled) {
            dismiss(id);
          }
        }}
      >
        <Close aria-hidden="true" />
      </button>
    </div>
  {/if}
</li>
