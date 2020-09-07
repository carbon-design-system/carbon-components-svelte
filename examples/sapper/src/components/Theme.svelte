<script>
  export let persist = false;
  export let persistKey = "theme";
  export let theme = "white";
  export const themes = ["white", "g10", "g90", "g100"];

  import { onMount, afterUpdate, setContext } from "svelte";
  import { writable, derived } from "svelte/store";

  const isValidTheme = (value) => themes.includes(value);
  const isDark = (value) =>
    isValidTheme(value) && (value === "g90" || value === "g100");

  const carbon_theme = writable(theme);
  const dark = writable(isDark(theme));
  const light = derived(dark, (_) => !_);

  const unsubscribe = carbon_theme.subscribe((value) => {
    theme = value;
  });

  let _document = null;

  setContext("Theme", {
    updateVar: (name, value) => {
      if (_document != null) {
        _document.documentElement.style.setProperty(name, value);
      }
    },
    carbon_theme,
    dark,
    light,
  });

  onMount(() => {
    _document = window.document;

    try {
      const persisted_theme = localStorage.getItem(persistKey);

      if (isValidTheme(persisted_theme)) {
        carbon_theme.set(persisted_theme);
      }
    } catch (error) {
      console.error(error);
    }

    return () => {
      unsubscribe();
    };
  });

  afterUpdate(() => {
    if (isValidTheme(theme)) {
      if (_document != null) {
        _document.documentElement.setAttribute("theme", theme);
      }

      if (persist) {
        localStorage.setItem(persistKey, theme);
      }
    } else {
      console.warn(
        `"${theme}" is not a valid Carbon theme. Choose from available themes: ${JSON.stringify(
          themes
        )}`
      );
    }
  });

  $: dark.set(isDark(theme));
</script>

<slot />
