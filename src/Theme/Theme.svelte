<script context="module">
  /** @typedef {"white" | "g10" | "g80" | "g90" | "g100"} CarbonTheme */

  import { themeLabels } from "./theme-labels.js";

  /** @type {Record<CarbonTheme, string>} */
  export const themes = themeLabels;
</script>

<script>
  /**
   * Dynamic, client-side theming using CSS variables.
   * Only works with `carbon-components-svelte/css/all.css`.
   */

  /**
   * @typedef {import("./carbon-tokens").CarbonToken} CarbonToken
   * @event update
   * @type {object}
   * @property {CarbonTheme} theme
   * @slot {{ theme: CarbonTheme; }}
   */

  /**
   * Set the current Carbon theme.
   * @type {CarbonTheme}
   * @bindable writable
   */
  export let theme = "white";

  /**
   * Customize a theme with your own tokens. Keys are Carbon v11 token names
   * (`"button-primary"`, `"layer-01"`), set as `--cds-{token}`.
   * @see https://carbondesignsystem.com/elements/themes/overview/#customizing-a-theme
   * @type {Partial<Record<CarbonToken, string>>}
   */
  export let tokens = {};

  /** Set to `true` to persist the theme using window.localStorage */
  export let persist = false;

  /** Specify the local storage key */
  export let persistKey = "theme";

  /**
   * Set to `true` to follow the operating system color scheme.
   * `theme` is set from `systemThemes` on mount and on every change;
   * set `theme` yourself to override until the next system change.
   */
  export let system = false;

  /**
   * Specify the themes to apply for the light and dark system color schemes.
   * @type {[light: CarbonTheme, dark: CarbonTheme]}
   */
  export let systemThemes = ["white", "g100"];

  /**
   * Render a toggle, select, or dropdown to control the theme.
   * @deprecated use `ThemeToggle`, `ThemeSelect`, or `ThemeDropdown` with
   * `bind:theme` instead. With `render`, every page that uses `Theme` ships
   * all three controls.
   * @type {"toggle" | "select" | "dropdown" | undefined}
   */
  export let render = undefined;

  /**
   * Override the default toggle props.
   * @deprecated pass props to `ThemeToggle` instead.
   * @type {import("../Toggle/Toggle.svelte").ToggleProps & { themes?: [labelA: CarbonTheme, labelB: CarbonTheme]; }}
   */
  export let toggle = {
    themes: ["white", "g100"],
    labelA: "",
    labelB: "",
    labelText: "Dark mode",
    hideLabel: false,
  };

  const themeKeys = /** @type {CarbonTheme[]} */ (Object.keys(themes));

  /**
   * Override the default select props.
   * @deprecated pass props to `ThemeSelect` instead.
   * @type {import("../Select/Select.svelte").SelectProps<CarbonTheme> & { themes?: CarbonTheme[]; }}
   */
  export let select = {
    themes: themeKeys,
    labelText: "Themes",
    hideLabel: false,
  };

  /**
   * Override the default dropdown props.
   * @deprecated pass props to `ThemeDropdown` instead.
   * @type {Omit<import("../Dropdown/Dropdown.svelte").DropdownProps, "items" | "selectedId"> & { themes?: CarbonTheme[]; }}
   */
  export let dropdown = {
    themes: themeKeys,
    labelText: "Themes",
    hideLabel: false,
  };

  import { createEventDispatcher, onMount, tick } from "svelte";
  import LocalStorage from "../LocalStorage/LocalStorage.svelte";
  import ThemeDropdown from "./ThemeDropdown.svelte";
  import ThemeSelect from "./ThemeSelect.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";
  import { withContextualTokens } from "./contextual-tokens.js";

  const dispatch = createEventDispatcher();

  // The deprecated `select` and `dropdown` props are typed for Select and
  // Dropdown, whose slot types don't line up with the controls' attributes.
  /**
   * @param {object} props
   * @returns {Record<string, any>}
   */
  function looseProps(props) {
    return props;
  }

  let prevTheme = theme;
  let mounted = false;

  // Captured before LocalStorage restores a stored value.
  const initialTheme = theme;

  /** @type {MediaQueryList | undefined} */
  let mql;

  // Tokens set on the document, so one dropped from `tokens` can be removed.
  /** @type {Set<string>} */
  const appliedTokens = new Set();

  /** @param {{ matches: boolean }} event */
  function onSystemChange(event) {
    theme = event.matches ? systemThemes[1] : systemThemes[0];
  }

  function watchSystem() {
    if (typeof window === "undefined" || !window.matchMedia) return;
    if (!mql) {
      mql = window.matchMedia("(prefers-color-scheme: dark)");
      mql.addEventListener("change", onSystemChange);
    }
    onSystemChange(mql);
  }

  function unwatchSystem() {
    mql?.removeEventListener("change", onSystemChange);
    mql = undefined;
  }

  function fallbackTheme() {
    if (mql) return mql.matches ? systemThemes[1] : systemThemes[0];
    return initialTheme;
  }

  function finishMount() {
    // Resolve the system theme before snapshotting so mount does not dispatch `update`.
    if (system) watchSystem();
    // A restored theme that is not valid is replaced in the next flush.
    prevTheme = persist && !(theme in themes) ? fallbackTheme() : theme;
    mounted = true;
  }

  onMount(() => {
    let destroyed = false;

    // With `system` and `persist`, wait for the mount flush to end so the
    // stored value is restored first. On Svelte 3/4 a second write to the
    // bound value in the same flush never reaches LocalStorage.
    if (system && persist) {
      tick().then(() => {
        if (!destroyed) finishMount();
      });
    } else {
      finishMount();
    }

    return () => {
      destroyed = true;
      unwatchSystem();
    };
  });

  // Runs before the apply block so the resolved theme is applied in the same flush.
  $: if (mounted) {
    if (system) {
      systemThemes;
      watchSystem();
    } else {
      unwatchSystem();
    }
  }

  // LocalStorage sets `undefined` when the key is removed or storage is
  // cleared, and a stored value can be any string.
  $: if (persist && !(theme in themes)) theme = fallbackTheme();

  $: appliedValues = withContextualTokens(tokens);

  // Apply theme before dispatching update. Reactive blocks run in source order,
  // and a throwing on:update handler aborts the rest of the flush.
  $: if (typeof window !== "undefined") {
    // Components that fade a color on hover would also fade it to the new
    // theme. Note the transitions running now, so only the ones the swap
    // starts are canceled below.
    const running = document.getAnimations
      ? new Set(document.getAnimations())
      : undefined;

    for (const token of appliedTokens) {
      if (token in appliedValues) continue;
      document.documentElement.style.removeProperty(`--cds-${token}`);
      appliedTokens.delete(token);
    }

    for (const [token, value] of Object.entries(appliedValues)) {
      document.documentElement.style.setProperty(`--cds-${token}`, value);
      appliedTokens.add(token);
    }

    if (theme in themes) {
      document.documentElement.setAttribute("theme", theme);
      document.documentElement.style.setProperty(
        "color-scheme",
        theme === "white" || theme === "g10" ? "light" : "dark",
      );
    } else {
      console.warn(
        `[Theme.svelte] invalid theme "${theme}". Value must be one of: ${JSON.stringify(
          Object.keys(themes),
        )}${
          // all.css has a CSS-only "system" theme for <html>, but `theme`
          // holds the concrete theme that controls show and `persist` stores.
          /** @type {string} */ (theme) === "system"
            ? '. Set the "system" prop to follow the system color scheme.'
            : ""
        }`,
      );
    }

    if (running) {
      // `getAnimations` applies the new styles, which starts the transitions.
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSTransition && !running.has(animation)) {
          animation.cancel();
        }
      }
    }
  }

  $: if (mounted && theme !== prevTheme) {
    prevTheme = theme;
    dispatch("update", { theme });
  }
</script>

{#if persist}
  <LocalStorage bind:value={theme} key={persistKey} />
{/if}

{#if render === "toggle"}
  <ThemeToggle {...toggle} bind:theme />
{:else if render === "select"}
  <ThemeSelect {...looseProps(select)} bind:theme />
{:else if render === "dropdown"}
  <ThemeDropdown {...looseProps(dropdown)} bind:theme />
{/if}

<slot {theme} />
