<script>
  /**
   * @restProps {div}
   * @slot {{ id: string; controlProps: { id: string; labelText: string; hideLabel: true; disabled: boolean; "aria-describedby": string | undefined }; invalid: boolean; invalidText: string; disabled: boolean; modified: boolean }}
   * @slot {{}} descriptionChildren
   */

  /**
   * Specify the setting's label.
   * @type {string}
   */
  export let label = "";

  /** Specify the text under the label. */
  export let description = "";

  /**
   * Specify the key of the setting in the `createSettings` values. It ties
   * the row to its changes, its server error and its default.
   * @type {string | undefined}
   */
  export let name = undefined;

  /**
   * Specify words a search should match that the label does not say.
   * @type {ReadonlyArray<string>}
   */
  export let keywords = [];

  /**
   * Set to `true` for a setting an administrator or a policy manages. The
   * control is disabled and a lock icon explains why.
   */
  export let locked = false;

  /** Specify the lock icon's tooltip. */
  export let lockedText = "Managed by your organization";

  /** Specify the lock icon's accessible name. */
  export let lockedLabel = "Locked";

  /** Specify the reset button's label. */
  export let resetText = "Reset to default";

  /** Specify the text read after the label when the value is unsaved. */
  export let modifiedText = "Modified";

  /**
   * Set to `false` to hide the reset button, for a setting with no default.
   */
  export let resettable = true;

  /** Specify the id of the control, which `controlProps` passes on. */
  export let id = uniqueId();

  /**
   * Obtain a reference to the row HTML element.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount, tick } from "svelte";
  import { readable } from "svelte/store";
  import Button from "../Button/Button.svelte";
  import TooltipIcon from "../TooltipIcon/TooltipIcon.svelte";
  import Locked from "../icons/Locked.svelte";
  import Undo from "../icons/Undo.svelte";
  import { focusQuietly } from "../utils/focus.js";
  import { highlightSegments } from "../utils/fuzzy-match.js";
  import { uniqueId } from "../utils/unique-id.js";

  /** @type {null | any} */
  const page = getContext("carbon:SettingsPage") ?? null;
  /** @type {null | { id: import("svelte/store").Readable<string> }} */
  const section = getContext("carbon:SettingsSection") ?? null;
  const sectionId = section?.id ?? readable("");

  const empty = readable(new Set());
  const errors = page?.settings.errors ?? readable({});
  const modifiedKeys = page?.settings.modified ?? empty;
  const customizedKeys = page?.settings.customized ?? empty;
  const result = page?.result ?? readable(null);

  /** @type {null | { update: (patch: any) => void, destroy: () => void }} */
  let registration = null;

  $: labelId = `${id}-label`;
  $: descriptionId = `${id}-description`;
  $: invalidText = name ? ($errors[name] ?? "") : "";
  $: invalid = invalidText !== "";
  $: modified = !!name && $modifiedKeys.has(name);
  $: resettableNow =
    resettable && !locked && !!name && !!page && $customizedKeys.has(name);

  // A row the page has not indexed yet shows, so first paint matches the
  // server.
  $: found = $result?.items.get(id);
  $: shown = found ? found.matched : true;
  $: labelSegments = highlightSegments(label, found?.labelIndices ?? []);
  $: descriptionSegments = highlightSegments(
    description,
    found?.descriptionIndices ?? [],
  );
  $: status = [locked && lockedText, modified && modifiedText]
    .filter(Boolean)
    .join(". ");
  $: describedby = description || status ? descriptionId : undefined;
  $: controlProps = {
    id,
    labelText: label,
    hideLabel: /** @type {const} */ (true),
    disabled: locked,
    "aria-describedby": describedby,
  };

  $: if (registration) {
    registration.update({
      sectionId: $sectionId,
      name,
      label,
      description,
      keywords,
    });
  }

  onMount(() => {
    if (!page) return;
    registration = page.registerRow({
      key: id,
      sectionId: $sectionId,
      name,
      label,
      description,
      keywords,
      node: ref,
    });
    return () => registration?.destroy();
  });

  async function reset() {
    if (!name) return;
    page.settings.resetField(name);
    // The reset button leaves once the value is the default.
    await tick();
    const control = ref
      ?.querySelector(".bx--settings-row__control")
      ?.querySelector(
        'input:not([type="hidden"]), select, textarea, button, [tabindex]:not([tabindex="-1"])',
      );
    if (control instanceof HTMLElement) focusQuietly(control);
  }
</script>

<div
  bind:this={ref}
  hidden={shown ? undefined : true}
  data-settings-row={name ?? label}
  class:bx--settings-row={true}
  class:bx--settings-row--modified={modified}
  class:bx--settings-row--locked={locked}
  class:bx--settings-row--invalid={invalid}
  {...$$restProps}
>
  <div class:bx--settings-row__text={true}>
    <div class:bx--settings-row__heading={true}>
      <span id={labelId} aria-hidden="true" class:bx--settings-row__label={true}
        >{#each labelSegments as segment, index (index)}{#if segment.match}<mark
              >{segment.text}</mark
            >{:else}{segment.text}{/if}{/each}</span
      >
      {#if locked}
        <TooltipIcon
          icon={Locked}
          tooltipText={lockedText}
          aria-label={lockedLabel}
          align="start"
        />
      {/if}
      {#if resettableNow}
        <Button
          kind="ghost"
          size="sm"
          icon={Undo}
          iconDescription={resetText}
          tooltipAlign="top"
          on:click={reset}
        />
      {/if}
    </div>
    {#if description || status}
      <div id={descriptionId} class:bx--settings-row__description={true}>
        <slot name="descriptionChildren"
          >{#each descriptionSegments as segment, index (index)}{#if segment.match}<mark
                >{segment.text}</mark
              >{:else}{segment.text}{/if}{/each}</slot
        >
        {#if status}
          <span class:bx--visually-hidden={true}>. {status}</span>
        {/if}
      </div>
    {/if}
  </div>
  <div class:bx--settings-row__control={true}>
    <slot
      {id}
      {controlProps}
      {invalid}
      {invalidText}
      disabled={locked}
      {modified}
    />
  </div>
</div>
