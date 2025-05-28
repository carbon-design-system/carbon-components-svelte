<script context="module">
  /** @type {HTMLDivElement | null} */
  let portalContainer = null;

  let instances = 0;

  /**
   * Creates or returns the shared portal container
   * @returns {HTMLDivElement}
   */
  function getPortalContainer() {
    if (!portalContainer && typeof document !== "undefined") {
      portalContainer = document.createElement("div");
      portalContainer.setAttribute("data-portal", "");
      document.body.appendChild(portalContainer);
    }

    return portalContainer;
  }
</script>

<script>
  import { onMount } from "svelte";

  /** @type {null | HTMLDivElement} */
  let portal = null;

  onMount(() => {
    instances++;
    const container = getPortalContainer();

    if (portal && container) {
      container.appendChild(portal);
    }

    return () => {
      instances--;

      if (portal?.parentNode) {
        portal.parentNode.removeChild(portal);
      }

      if (instances === 0 && portalContainer?.parentNode) {
        portalContainer.parentNode.removeChild(portalContainer);
        portalContainer = null;
      }
    };
  });
</script>

<div bind:this={portal}>
  <slot />
</div>
