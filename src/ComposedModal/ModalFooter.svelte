<script>
  /**
   * @event {{ text: string; }} click:button--secondary
   */

  /** Specify the primary button text */
  export let primaryButtonText = "";

  /**
   * Specify the primary button icon
   * @type {typeof import("svelte").SvelteComponent<any>}
   */
  export let primaryButtonIcon = undefined;

  /** Set to `true` to disable the primary button */
  export let primaryButtonDisabled = false;

  /**
   * Specify a class for the primary button
   * @type {string}
   */
  export let primaryClass = undefined;

  /** Specify the secondary button text */
  export let secondaryButtonText = "";

  /**
   * 2-tuple prop to render two secondary buttons for a 3 button modal
   * supersedes `secondaryButtonText`
   * @type {[{ text: string; }, { text: string; }]}
   */
  export let secondaryButtons = [];

  /**
   * Specify a class for the secondary button
   * @type {string}
   */
  export let secondaryClass = undefined;

  /** Set to `true` to use the danger variant */
  export let danger = false;

  import { getContext, createEventDispatcher } from "svelte";
  import Button from "../Button/Button.svelte";

  const dispatch = createEventDispatcher();
  const { closeModal, submit } = getContext("ComposedModal");
</script>

<div
  class:bx--modal-footer="{true}"
  class:bx--modal-footer--three-button="{secondaryButtons.length === 2}"
  {...$$restProps}
>
  {#if secondaryButtons.length > 0}
    {#each secondaryButtons as button}
      <Button
        kind="secondary"
        on:click="{() => {
          dispatch('click:button--secondary', { text: button.text });
        }}"
      >
        {button.text}
      </Button>
    {/each}
  {:else if secondaryButtonText}
    <Button
      kind="secondary"
      class="{secondaryClass}"
      on:click="{() => {
        closeModal();
        dispatch('click:button--secondary', { text: secondaryButtonText });
      }}"
    >
      {secondaryButtonText}
    </Button>
  {/if}
  {#if primaryButtonText}
    <Button
      kind="{danger ? 'danger' : 'primary'}"
      disabled="{primaryButtonDisabled}"
      class="{primaryClass}"
      icon="{primaryButtonIcon}"
      on:click="{submit}"
    >
      {primaryButtonText}
    </Button>
  {/if}
  <slot />
</div>
