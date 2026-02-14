<script>
  import { metatags, page } from "@sveltech/routify";
  import { onMount } from "svelte";

  $: exampleName = $page.title;
  $: componentName = $page.parent?.title ?? "";

  $: metatags.title = `${exampleName} – Carbon Components Svelte`;
  $: metatags.description = `${exampleName} example for the ${componentName} component in Carbon Components Svelte.`;

  onMount(() => {
    document.body.classList.add("framed");
    return () => {
      document.body.classList.remove("framed");
    };
  });

  $: {
    const searchParams = new URLSearchParams(window.location.search);
    const current_theme = searchParams.get("theme");

    // NOTE: we *do not* want to persist the theme as this can
    // conflict with how the iframe is displayed in the docs.
    // Instead, we want the theme to be overridden in the standalone page.
    if (["white", "g10", "g80", "g90", "g100"].includes(current_theme)) {
      document.documentElement.setAttribute("theme", current_theme);
      document.documentElement.style.setProperty(
        "color-scheme",
        ["white", "g10"].includes(current_theme) ? "light" : "dark",
      );
    }
  }
</script>

<svelte:head>
  <link
    rel="canonical"
    href="https://svelte.carbondesignsystem.com{$page.path}"
  />
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
</style>
