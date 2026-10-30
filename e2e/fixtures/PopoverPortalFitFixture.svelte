<script>
  import { Button, Modal, Popover, Toggletip } from "carbon-components-svelte";

  // `?dir=rtl` sets the page direction before anything mounts, since the
  // components read it when they open.
  if (new URLSearchParams(location.search).get("dir") === "rtl") {
    document.documentElement.dir = "rtl";
  }

  let modalOpen = false;
  let open = { modal: false, page: false };
  /** @type {"bottom" | "right-end" | "bottom-start"} */
  let pageAlign = "bottom";
  const text = "Replicated to two zones, backed up nightly, kept for 30 days.";
</script>

<!-- Outside a Modal: a Toggletip and a Popover that always portal. In the
Modal, the short Popover trigger near the start edge makes it fit to the
start at 320 px. -->
<div style="padding: 1rem">
  <div style="display: flex; gap: 1rem; align-items: center">
    <span data-testid="page-toggletip">
      <Toggletip portalTooltip iconDescription="Toggletip on the page"
        ><p>{text}</p></Toggletip
      >
    </span>
    <span data-testid="page-popover" style="position: relative">
      <Button size="sm" on:click={() => (open.page = !open.page)}
        >Popover on the page</Button
      >
      <Popover open={open.page} portalPopover caret align={pageAlign}
        ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
      >
    </span>
  </div>
  <div style="display: flex; gap: 1rem; margin-top: 1rem">
    <Button size="sm" kind="tertiary" on:click={() => (modalOpen = true)}
      >Open modal</Button
    >
    <Button size="sm" kind="ghost" on:click={() => (pageAlign = "right-end")}
      >Align right-end</Button
    >
    <Button size="sm" kind="ghost" on:click={() => (pageAlign = "bottom-start")}
      >Align bottom-start</Button
    >
  </div>
</div>

<Modal
  bind:open={modalOpen}
  passiveModal
  modalHeading="Popover in a Modal"
  on:close={() => (open.modal = false)}
>
  <div style="display: flex; gap: 1rem; align-items: center">
    <span data-testid="modal-toggletip">
      <Toggletip iconDescription="Toggletip in a modal"><p>{text}</p></Toggletip
      >
    </span>
    <span data-testid="modal-popover" style="position: relative">
      <Button size="sm" on:click={() => (open.modal = !open.modal)}>Plan</Button
      >
      <Popover open={open.modal} portalPopover caret align="bottom"
        ><div style="padding: 1rem; width: 16rem">{text}</div></Popover
      >
    </span>
  </div>
</Modal>
