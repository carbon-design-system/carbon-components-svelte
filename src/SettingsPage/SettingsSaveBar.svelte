<script>
  /**
   * @restProps {div}
   * @slot {{ changed: number; dirty: boolean; saving: boolean }}
   */

  /**
   * Specify the text that reports the unsaved changes.
   * @type {(count: number) => string}
   */
  export let changesText = defaultChangesText;

  /**
   * Specify the text that reports field errors after a failed save.
   * @type {(count: number) => string}
   */
  export let errorsText = defaultErrorsText;

  /** Specify the text shown while the save runs. */
  export let savingText = "Saving";

  /** Specify the save button text. */
  export let saveText = "Save";

  /** Specify the discard button text. */
  export let discardText = "Discard";

  /** Specify the accessible name of the bar. */
  export let labelText = "Unsaved changes";

  /**
   * Specify the keyboard shortcut that saves, or `""` for none.
   * @type {string}
   */
  export let shortcut = "mod+s";

  /**
   * Obtain a reference to the bar HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext } from "svelte";
  import { readable } from "svelte/store";
  import Button from "../Button/Button.svelte";

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultChangesText(count) {
    return count === 1
      ? "You have 1 unsaved change"
      : `You have ${count} unsaved changes`;
  }

  /**
   * @param {number} count
   * @returns {string}
   */
  function defaultErrorsText(count) {
    return count === 1
      ? "1 setting could not be saved"
      : `${count} settings could not be saved`;
  }

  /** @type {null | any} */
  const page = getContext("carbon:SettingsPage") ?? null;
  const dirtyStore = page?.settings.dirty ?? readable(false);
  const changedStore = page?.settings.changed ?? readable(0);
  const savingStore = page?.settings.saving ?? readable(false);
  const errorsStore = page?.settings.errors ?? readable({});

  $: visible = $dirtyStore || $savingStore;
  $: errorCount = Object.keys($errorsStore).length;
  $: message = $savingStore
    ? savingText
    : errorCount > 0
      ? errorsText(errorCount)
      : changesText($changedStore);
</script>

<!-- The bar always holds its place, so it appearing moves nothing. While it
  is hidden it is inert, which removes it from the tab order and the
  accessibility tree. -->
<div
  bind:this={ref}
  role="region"
  aria-label={labelText}
  inert={visible ? undefined : true}
  class:bx--settings-save-bar={true}
  class:bx--settings-save-bar--visible={visible}
  class:bx--settings-save-bar--invalid={errorCount > 0}
  {...$$restProps}
>
  <p class:bx--settings-save-bar__message={true}>
    <slot changed={$changedStore} dirty={$dirtyStore} saving={$savingStore}>
      {message}
    </slot>
  </p>
  <div class:bx--settings-save-bar__actions={true}>
    <Button
      kind="ghost"
      disabled={$savingStore}
      on:click={() => page?.discard()}
    >
      {discardText}
    </Button>
    <Button
      kind="primary"
      loading={$savingStore}
      {shortcut}
      on:click={() => page?.save()}
    >
      {saveText}
    </Button>
  </div>
</div>
