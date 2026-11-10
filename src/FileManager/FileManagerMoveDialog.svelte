<script>
  /**
   * The "Move to..." dialog: a folder picker that is a second lazily loaded
   * `TreeView`, for moving without a drag. Internal.
   * @event {{ destination: string }} move
   */

  export let open = false;

  /** The paths being moved. */
  /** @type {ReadonlyArray<string>} */
  export let paths = [];

  /** The folder the dialog opens on, which is also where the items are. */
  export let from = "/";

  /** @type {(path: string) => Promise<ReadonlyArray<{ path: string, name: string, kind: string }>>} */
  export let loadFolder;

  /** @type {import("./texts.js").FileManagerTexts} */
  export let texts;

  export let rootLabel = "";

  export let id = "file-manager-move";

  import { createEventDispatcher } from "svelte";
  import Modal from "../Modal/Modal.svelte";
  import TreeView from "../TreeView/TreeView.svelte";
  import { baseName, isInside } from "../utils/file-system.js";
  import { createFolderTree, setChildren } from "./folder-tree.js";

  const dispatch = createEventDispatcher();

  let { roots, byId } = createFolderTree(rootLabel);
  /** @type {string[]} */
  let expandedIds = ["/"];
  /** @type {string[]} */
  let selected = [];
  let activeId = "";
  let wasOpen = false;
  let failed = false;

  /** A folder cannot move into itself or below itself. */
  function blocked(/** @type {string} */ path) {
    return paths.some((moving) => isInside(path, moving));
  }

  async function load(/** @type {string} */ path) {
    try {
      const listing = await loadFolder(path);
      setChildren(byId, path, listing, blocked);
      roots = roots;
      failed = false;
    } catch {
      failed = true;
    }
  }

  async function reset() {
    ({ roots, byId } = createFolderTree(rootLabel));
    expandedIds = ["/"];
    selected = [from];
    activeId = from;
    await load("/");
    // Open the tree down to where the items are.
    let walked = "/";
    for (const name of from.split("/").filter(Boolean)) {
      walked = walked === "/" ? `/${name}` : `${walked}/${name}`;
      // biome-ignore lint/performance/noAwaitInLoops: top down, in order
      await load(walked);
      expandedIds = [...expandedIds, walked];
    }
  }

  /** @param {CustomEvent<{ id: string, expanded: boolean, hasChildren?: boolean, nodes?: unknown[] }>} event */
  function handleToggle(event) {
    const node = event.detail;
    if (node.expanded && node.hasChildren && !node.nodes) load(node.id);
  }

  function confirm() {
    dispatch("move", { destination: selected[0] });
    open = false;
  }

  $: if (open !== wasOpen) {
    wasOpen = open;
    if (open) reset();
  }
  $: destination = selected[0];
  $: unchanged =
    destination === undefined ||
    paths.every(
      (path) =>
        path.slice(0, path.lastIndexOf("/")) ===
        (destination === "/" ? "" : destination),
    );
  $: heading = texts.moveTitle(
    paths.length,
    paths.length === 1 ? baseName(paths[0]) : "",
  );
</script>

<Modal
  bind:open
  {id}
  size="xs"
  modalHeading={heading}
  primaryButtonText={texts.moveConfirm}
  primaryButtonDisabled={unchanged}
  secondaryButtonText={texts.cancel}
  hasScrollingContent
  on:click:button--secondary={() => (open = false)}
  on:submit={confirm}
>
  <div class:bx--file-manager__move-tree={true}>
    {#if failed}
      <p>{texts.loadFailed(rootLabel)}</p>
    {/if}
    <TreeView
      id="{id}-tree"
      labelText={texts.moveTreeLabel}
      nodes={roots}
      size="default"
      bind:selectedIds={selected}
      bind:expandedIds
      bind:activeId
      on:toggle={handleToggle}
    />
  </div>
</Modal>
