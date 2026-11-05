<script>
  // One overlay, placed by the query string, for comparing where each
  // anchored overlay lands across places, directions and ancestors:
  //   kind    popover, tooltip, tooltipicon, tooltipdef, button, toggletip,
  //           dropdown, combobox, multiselect, menubutton, overflowmenu,
  //           contextmenu
  //   at      where the trigger sits in the window: center, top, bottom,
  //           left, right, topleft, bottomright
  //   ctx     what is around it: none, clip, scroll, transform, zoom,
  //           scrolled, modal, dialog
  //   dir     ltr or rtl
  //   direction, align, portal  as each component's own props
  import ComposedModal from "carbon-components-svelte/ComposedModal/ComposedModal.svelte";
  import ModalBody from "carbon-components-svelte/ComposedModal/ModalBody.svelte";
  import ContextMenu from "carbon-components-svelte/ContextMenu/ContextMenu.svelte";
  import ContextMenuOption from "carbon-components-svelte/ContextMenu/ContextMenuOption.svelte";
  import PositioningProbe from "./PositioningProbe.svelte";

  const query = new URLSearchParams(location.search);
  const kind = query.get("kind") ?? "popover";
  const at = query.get("at") ?? "center";
  const ctx = query.get("ctx") ?? "none";
  const direction = query.get("direction") ?? "bottom";
  const align = query.get("align") ?? "center";
  const portal = query.has("portal")
    ? query.get("portal") === "true"
    : undefined;
  if (query.get("dir") === "rtl") document.documentElement.dir = "rtl";

  const spot = {
    center: "left: calc(50% - 5rem); top: calc(50% - 1rem)",
    top: "left: calc(50% - 5rem); top: 8px",
    bottom: "left: calc(50% - 5rem); bottom: 8px",
    left: "left: 8px; top: calc(50% - 1rem)",
    right: "right: 8px; top: calc(50% - 1rem)",
    topleft: "left: 8px; top: 8px",
    bottomright: "right: 8px; bottom: 8px",
  }[at];

  // Window scroll puts the trigger at document coordinates.
  const scrolled = ctx === "scrolled";
  const hostPosition = scrolled
    ? `position: absolute; left: calc(50% - 5rem); top: 900px`
    : `position: fixed; ${spot}`;
  const around = {
    clip: "overflow: hidden; width: 11rem; height: 3rem; position: relative",
    transform: "transform: translate(7px, 5px)",
    zoom: "zoom: 1.25",
  }[ctx];

  let modalOpen = ctx === "modal";
  let dialog;
  import { onMount } from "svelte";
  onMount(() => {
    if (ctx === "dialog") dialog?.showModal();
    if (scrolled) window.scrollTo(0, 500);
    // The scroll box's own scroll.
    for (const box of document.querySelectorAll("[data-scroll-box]")) {
      box.scrollTop = 20;
    }
  });
</script>

{#if scrolled}
  <div style="height: 3000px"></div>
{/if}

{#if kind === "contextmenu"}
  <p style="padding: 1rem" data-testid="context-area">Right click anywhere</p>
  <ContextMenu>
    <ContextMenuOption labelText="Cut" />
    <ContextMenuOption labelText="Copy" />
    <ContextMenuOption labelText="Share">
      <ContextMenuOption labelText="Email" />
      <ContextMenuOption labelText="Link" />
    </ContextMenuOption>
  </ContextMenu>
{:else if ctx === "modal"}
  <ComposedModal bind:open={modalOpen} size="sm">
    <ModalBody>
      <div style="min-height: 12rem; padding-top: 4rem">
        <PositioningProbe {kind} {direction} {align} {portal} />
      </div>
    </ModalBody>
  </ComposedModal>
{:else if ctx === "dialog"}
  <dialog
    bind:this={dialog}
    style="width: 24rem; height: 14rem; padding: 1rem; overflow: visible"
  >
    <PositioningProbe {kind} {direction} {align} {portal} />
  </dialog>
{:else if ctx === "scroll"}
  <div style="{hostPosition}; width: 18rem">
    <div
      data-scroll-box
      style="overflow: auto; height: 9rem; border: 1px solid #8d8d8d"
    >
      <div data-scroll-box style="overflow: auto; height: 20rem; padding: 1rem">
        <div style="height: 6rem"></div>
        <PositioningProbe {kind} {direction} {align} {portal} />
        <div style="height: 20rem"></div>
      </div>
    </div>
  </div>
{:else}
  <div style={hostPosition}>
    <div style={around}>
      <PositioningProbe {kind} {direction} {align} {portal} />
    </div>
  </div>
{/if}
