<script>
  /**
   * @typedef {import("./shortcut-registry.js").ShortcutSpec} ShortcutSpec
   * @restProps {div}
   * @slot {{}}
   */

  /**
   * ShortcutProvider keeps the keyboard shortcuts of an app in one place.
   * It listens for `keydown` once, runs the shortcut that matches, and
   * collects every shortcut registered with `use:shortcut` or `shortcuts`
   * so a help sheet can list them. Wrap the app in one.
   *
   * Nest a provider with a `titleText` inside a modal or a side panel to
   * start a scope. Its shortcuts work while it is shown, and shadow a
   * shortcut with the same keys outside it.
   *
   * @example
   * ```svelte
   * <ShortcutProvider>
   *   <div use:shortcut={{ keys: "mod+k", label: "Open command palette", onTrigger: open }}>
   *     <Button on:click={open}>Search</Button>
   *   </div>
   * </ShortcutProvider>
   * ```
   */

  /**
   * Specify the heading of the provider's shortcuts in a help sheet, such
   * as "Edit profile". A provider inside another one is a nested scope.
   * Leave it unset for the app's own shortcuts.
   * @type {string | undefined}
   */
  export let titleText = undefined;

  /**
   * Specify shortcuts that belong to no element, such as one that opens a
   * command palette. For a shortcut on a control, use `use:shortcut`.
   * @type {ReadonlyArray<ShortcutSpec>}
   */
  export let shortcuts = [];

  /** Set an id for the top-level element */
  export let id = uniqueId();

  /**
   * Obtain a reference to the top-level HTML element.
   * @bindable readonly
   * @type {null | HTMLDivElement}
   */
  export let ref = null;

  import { getContext, onMount, setContext } from "svelte";
  import { SHORTCUT_CONTEXT_KEY } from "../constants/context-keys.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { createShortcutScope } from "./shortcut-registry.js";

  /** @type {import("./shortcut-registry.js").ShortcutScope | undefined} */
  const parent = getContext(SHORTCUT_CONTEXT_KEY);
  /** @type {import("./shortcut-registry.js").ShortcutScope} */
  const node = createShortcutScope({ id, name: titleText, parent });
  setContext(SHORTCUT_CONTEXT_KEY, node);

  /** @type {Array<ReturnType<typeof node.register>>} */
  let handles = [];
  let mounted = false;

  onMount(() => {
    mounted = true;
    // Only the outermost provider listens; nested ones share its registry.
    const stop = parent ? undefined : node.root.start();
    return () => {
      stop?.();
      node.destroy();
      mounted = false;
    };
  });

  $: node.rekey(id);
  $: node.name = titleText;
  $: if (ref) node.element = ref;
  $: if (mounted) syncShortcuts(shortcuts);

  /** @param {ReadonlyArray<ShortcutSpec>} next */
  function syncShortcuts(next) {
    next.forEach((spec, index) => {
      if (handles[index]) handles[index].update(spec);
      else handles[index] = node.register(spec);
    });
    for (const handle of handles.splice(next.length)) handle.destroy();
  }
</script>

<div
  bind:this={ref}
  {...$$restProps}
  {id}
  data-shortcut-scope=""
  style:display="contents"
>
  <slot />
</div>
