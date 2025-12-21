<script>
  /**
   * Specify the kind of contained list.
   * @type {"on-page" | "disclosed"}
   */
  export let kind = "on-page";

  /**
   * Specify the label text.
   * Alternatively, use the named slot "labelChildren".
   */
  export let labelText = "";

  /**
   * Specify the size of the list.
   * @type {"sm" | "md" | "lg" | "xl"}
   */
  export let size = "md";

  /** Set to `true` for lines between list items to be inset */
  export let inset = false;

  /** Set an id for the list element */
  export let id = "ccs-" + Math.random().toString(36);

  $: labelId = `label-${id}`;
</script>

<div
  class:bx--contained-list="{true}"
  class:bx--contained-list--inset-rulers="{inset}"
  class:bx--contained-list--sm="{size === 'sm'}"
  class:bx--contained-list--md="{size === 'md'}"
  class:bx--contained-list--lg="{size === 'lg'}"
  class:bx--contained-list--xl="{size === 'xl'}"
  class:bx--layout--size-sm="{size === 'sm'}"
  class:bx--layout--size-md="{size === 'md'}"
  class:bx--layout--size-lg="{size === 'lg'}"
  class:bx--layout--size-xl="{size === 'xl'}"
  class:bx--contained-list--on-page="{kind === 'on-page'}"
  class:bx--contained-list--disclosed="{kind === 'disclosed'}"
>
  {#if labelText || $$slots.labelChildren || $$slots.action}
    <div
      class:bx--contained-list__header="{true}"
      class:bx--layout--size-sm={kind !== 'disclosed' && size === 'sm'}
      class:bx--layout--size-md={kind !== 'disclosed' && size === 'md'}
      class:bx--layout--size-lg={kind !== 'disclosed' && size === 'lg'}
      class:bx--layout--size-xl={kind !== 'disclosed' && size === 'xl'}
    >
      {#if labelText || $$slots.labelChildren}
        <div id="{labelId}" class:bx--contained-list__label="{true}">
          <slot name="labelChildren">
            {labelText}
          </slot>
        </div>
      {/if}
      {#if $$slots.action}
        <div class:bx--contained-list__action="{true}">
          <slot name="action" />
        </div>
      {/if}
    </div>
  {/if}
  <ul role="list" aria-labelledby={labelText || $$slots.labelChildren ? labelId : undefined}>
    <slot />
  </ul>
</div>

