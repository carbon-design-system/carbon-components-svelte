<script>
  import Menu from "carbon-components-svelte/Menu/Menu.svelte";
  import MenuItem from "carbon-components-svelte/Menu/MenuItem.svelte";
  // Places where an overlay has to find its own way, picked by `?scene=`:
  //   target      portalled into a transformed box, which places `fixed`
  //               from its own edge
  //   motion      the anchor rides a CSS transition
  //   fullscreen  the anchor is in the fullscreen element
  import FloatingPortal from "carbon-components-svelte/Portal/FloatingPortal.svelte";

  const scene = new URLSearchParams(location.search).get("scene") ?? "target";

  /** @type {HTMLElement | null} */
  let anchor = null;
  /** @type {HTMLElement | null} */
  let host = null;
  /** @type {HTMLElement | null} */
  let stage = null;
  let open = scene === "target";
  let moved = false;
  let menuOpen = false;

  function handleMove() {
    moved = true;
    open = true;
  }

  async function handleFullscreen() {
    await stage?.requestFullscreen();
    menuOpen = true;
  }
</script>

{#if scene === "target"}
  <div
    bind:this={host}
    id="host"
    style="position: relative; transform: translate(40px, 30px); width: 10rem; height: 8rem; margin: 1rem; background: #f4f4f4"
  >
    <button bind:this={anchor} type="button" style="margin: 1rem">Anchor</button
    >
  </div>
  <FloatingPortal
    {anchor}
    {open}
    direction="bottom"
    intrinsicWidth
    target={host}
  >
    <div id="tip" style="padding: 4px 8px; background: #161616; color: #fff">
      Tip
    </div>
  </FloatingPortal>
{:else if scene === "motion"}
  <div
    style="transition: transform 400ms linear; margin: 1rem"
    style:transform={moved ? "translate(240px, 60px)" : "none"}
  >
    <button bind:this={anchor} type="button" on:click={handleMove}
      >Anchor</button
    >
  </div>
  <FloatingPortal {anchor} {open} direction="bottom" intrinsicWidth>
    <div id="tip" style="padding: 4px 8px; background: #161616; color: #fff">
      Tip
    </div>
  </FloatingPortal>
{:else if scene === "fullscreen"}
  <div
    bind:this={stage}
    id="stage"
    style="background: #fff; min-height: 20rem; padding: 3rem"
  >
    <button bind:this={anchor} type="button" on:click={handleFullscreen}
      >Go fullscreen</button
    >
    <Menu {anchor} bind:open={menuOpen} direction="bottom" labelText="Actions">
      <MenuItem labelText="Cut" />
      <MenuItem labelText="Copy" />
    </Menu>
  </div>
{/if}
