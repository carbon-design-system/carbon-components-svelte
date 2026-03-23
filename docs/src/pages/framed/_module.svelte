<script>
  import { activeRoute } from "@roxi/routify";
  import { onMount } from "svelte";

  $: exampleName = $activeRoute?.leaf?.node?.name ?? "";
  $: componentName = $activeRoute?.leaf?.node?.parent?.name ?? "";

  const validThemes = ["white", "g10", "g80", "g90", "g100"];

  function applyTheme(theme) {
    if (validThemes.includes(theme)) {
      document.documentElement.setAttribute("theme", theme);
      document.documentElement.style.setProperty(
        "color-scheme",
        ["white", "g10"].includes(theme) ? "light" : "dark",
      );
    }
  }

  onMount(() => {
    document.body.classList.add("framed");

    // Intercept localStorage.setItem in this frame so that
    // theme changes made via localStorage are applied immediately.
    const _setItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      _setItem(key, value);
      if (key === "theme") applyTheme(value);
    };

    // Listen for cross-document storage changes (e.g., from the parent docs page).
    function handleStorage(event) {
      if (event.key === "theme") applyTheme(event.newValue);
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      document.body.classList.remove("framed");
      localStorage.setItem = _setItem;
      window.removeEventListener("storage", handleStorage);
    };
  });

  $: {
    const searchParams = new URLSearchParams(window.location.search);
    const current_theme = searchParams.get("theme");

    // NOTE: we *do not* want to persist the theme as this can
    // conflict with how the iframe is displayed in the docs.
    // Instead, we want the theme to be overridden in the standalone page.
    applyTheme(current_theme);
  }
</script>

<!-- routify:meta reset -->
<svelte:head>
  <title>{exampleName} – Carbon Components Svelte</title>
  <meta
    name="description"
    content="{exampleName} example for the {componentName} component in Carbon Components Svelte."
  >
  <link
    rel="canonical"
    href="https://svelte.carbondesignsystem.com{$activeRoute?.leaf?.node?.path ?? ''}"
  >
</svelte:head>

<slot />

<style>
  :global(body.framed) {
    min-height: 100vh;
    width: 100%;
    padding: var(--cds-spacing-06) var(--cds-spacing-05);
  }

  :global(.framed :not(.bx--content) [class^="bx--col"]) {
    outline: 1px solid var(--cds-interactive-04);
  }

  :global(.framed .bx--content [class^="bx--col"]) {
    outline: 0;
  }

  :global([data-outline]) {
    outline: 1px solid var(--cds-interactive-01);
  }

  :global([data-centered]) {
    position: absolute;
    width: calc(100% - var(--cds-spacing-05));
    height: calc(100% - var(--cds-spacing-06));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--cds-text-02);
  }
</style>
