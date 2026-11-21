<script>
  /**
   * @event close
   * @type {object}
   * @property {"escape-key" | "outside-click" | "close-button" | "programmatic"} trigger
   */

  /**
   * @event {null} open
   * @restProps {div}
   */

  /**
   * ShortcutHelp is a modal that lists the shortcuts a `ShortcutProvider`
   * has registered, grouped by scope, each as its keys and what it does.
   * It lists what works now: a scope that is closed or hidden is left out,
   * and so is a shortcut that an inner scope shadows or whose element is
   * disabled. Place it once, inside the provider.
   *
   * `?` opens and closes it outside text fields. A single-character
   * shortcut must be able to change (WCAG 2.1.4), so set `shortcut` to
   * remap it, or to `""` to remove it and open the sheet from a control.
   *
   * @example
   * ```svelte
   * <ShortcutProvider>
   *   <ShortcutHelp />
   * </ShortcutProvider>
   * ```
   */

  /**
   * Set to `true` to open the sheet.
   * @bindable writable
   */
  export let open = false;

  /**
   * Specify the keys that open and close the sheet, such as `"?"` or
   * `"mod+/"`. Set to `""` for none.
   */
  export let shortcut = "?";

  /** Specify the heading of the sheet. */
  export let titleText = "Keyboard shortcuts";

  /** Specify the text shown when no shortcut is available. */
  export let emptyText = "No keyboard shortcuts are available here.";

  /** Specify the heading of the shortcuts that belong to no named scope. */
  export let generalText = "General";

  /** Specify what the sheet's own shortcut does, as its row reads. */
  export let toggleText = "Show keyboard shortcuts";

  /**
   * Specify the label of the close button.
   * It names the button and shows in its tooltip.
   */
  export let iconDescription = "Close";

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import DescriptionList from "../DescriptionList/DescriptionList.svelte";
  import DescriptionListItem from "../DescriptionList/DescriptionListItem.svelte";
  import Kbd from "../Kbd/Kbd.svelte";
  import Modal from "../Modal/Modal.svelte";
  import Stack from "../Stack/Stack.svelte";
  import { SHORTCUT_CONTEXT_KEY } from "../constants/context-keys.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { activeShortcutGroups } from "./shortcut-registry.js";

  /** @type {import("./shortcut-registry.js").ShortcutScope | undefined} */
  const scope = getContext(SHORTCUT_CONTEXT_KEY);
  /** @type {import("svelte/store").Readable<import("./shortcut-registry.js").ShortcutEntry[]>} */
  const entries = scope?.root.entries ?? readable([]);

  /** @type {null | ReturnType<NonNullable<typeof scope>["register"]>} */
  let handle = null;
  let mounted = false;

  onMount(() => {
    mounted = true;
    if (!scope) {
      console.warn("[ShortcutHelp.svelte] needs a ShortcutProvider around it.");
    }
    return () => {
      handle?.destroy();
      handle = null;
      mounted = false;
    };
  });

  function toggle() {
    open = !open;
  }

  /**
   * @param {string} keys
   * @param {string} label
   * @param {boolean} ready
   */
  function syncShortcut(keys, label, ready) {
    if (!scope || !ready) return;
    if (!keys) {
      handle?.destroy();
      handle = null;
      return;
    }
    const spec = { keys, label, onTrigger: toggle };
    if (handle) handle.update(spec);
    else handle = scope.register(spec);
  }

  $: syncShortcut(shortcut, toggleText, mounted);

  // The groups are read when the sheet opens or a shortcut registers, with
  // the sheet itself left out of the modal check: it is in front, but the
  // shortcuts under it are the ones to list.
  $: groups =
    open && scope ? activeShortcutGroups(scope.root, $entries, ref) : [];
</script>

<Modal
  bind:open
  bind:ref
  passiveModal
  size="sm"
  {id}
  modalHeading={titleText}
  {iconDescription}
  {...$$restProps}
  on:open
  on:close
>
  {#if groups.length === 0}
    <p>{emptyText}</p>
  {:else}
    <Stack gap={7}>
      {#each groups as group (group.scope ?? "")}
        <section>
          <h3 class:bx--type-heading-compact-01={true}>
            {group.scope || generalText}
          </h3>
          <DescriptionList layout="summary" gap={3}>
            {#each group.entries as entry (entry)}
              <DescriptionListItem term={entry.label}>
                <Kbd shortcut={entry.keys} />
              </DescriptionListItem>
            {/each}
          </DescriptionList>
        </section>
      {/each}
    </Stack>
  {/if}
</Modal>
