<script>
  /**
   * Dynamic, client-side theming using CSS variables
   * Only works with `carbon-components-svelte/css/all.css`
   */

  /**
   * @typedef {"white" | "g10" | "g80" | "g90" | "g100"} CarbonTheme
   * @event {{ theme: CarbonTheme; }} update
   * @slot {{ theme: CarbonTheme; }}
   */

  /**
   * Set the current Carbon theme
   * @type {CarbonTheme}
   */
  export let theme = "white";

  /**
   * Customize a theme with your own tokens
   * @see https://carbondesignsystem.com/guidelines/themes/overview#customizing-a-theme
   * @type {{ [token: string]: any; }}
   */
  export let tokens = {};

  /** Set to `true` to persist the theme using window.localStorage */
  export let persist = false;

  /** Specify the local storage key */
  export let persistKey = "theme";

  /**
   * Render a toggle or select dropdown to control the theme
   * @type {"toggle" | "select"}
   */
  export let render = undefined;

  /**
   * Override the default toggle props
   * @type {import("../Toggle/Toggle").ToggleProps & { themes?: [labelA: CarbonTheme, labelB: CarbonTheme]; }}
   */
  export let toggle = {
    themes: ["white", "g100"],
    labelA: "",
    labelB: "",
    labelText: "Dark mode",
    hideLabel: false,
  };

  /** @type {Record<CarbonTheme, string>} */
  const themes = {
    white: "White",
    g10: "Gray 10",
    g80: "Gray 80",
    g90: "Gray 90",
    g100: "Gray 100",
  };

  /** @type {CarbonTheme} */
  const themeKeys = Object.keys(themes);

  /**
   * Override the default select props
   * @type {import("../Select/Select").SelectProps & { themes?: CarbonTheme[]; }}
   */
  export let select = {
    themes: themeKeys,
    labelText: "Themes",
    hideLabel: false,
  };

  import { createEventDispatcher } from "svelte";
  import Toggle from "../Toggle/Toggle.svelte";
  import Select from "../Select/Select.svelte";
  import SelectItem from "../Select/SelectItem.svelte";
  import LocalStorage from "../LocalStorage/LocalStorage.svelte";

  const dispatch = createEventDispatcher();

  $: if (typeof window !== "undefined") {
    Object.entries(tokens).forEach(([token, value]) => {
      document.documentElement.style.setProperty(`--cds-${token}`, value);
    });

    if (theme in themes) {
      document.documentElement.setAttribute("theme", theme);
      dispatch("update", { theme });
    } else {
      console.warn(
        `[Theme.svelte] invalid theme "${theme}". Value must be one of: ${JSON.stringify(
          Object.keys(themes)
        )}`
      );
    }
  }
</script>

{#if persist}
  <LocalStorage bind:value="{theme}" key="{persistKey}" />
{/if}

{#if render === "toggle"}
  <Toggle
    {...toggle}
    toggled="{theme === toggle.themes[1]}"
    on:toggle="{({ detail }) => {
      theme = detail.toggled ? toggle.themes[1] : toggle.themes[0];
    }}"
  />
{:else if render === "select"}
  <Select {...select} bind:selected="{theme}">
    {#each select.themes as theme (theme)}
      <SelectItem value="{theme}" text="{themes[theme]}" />
    {/each}
  </Select>
{/if}

<slot theme="{theme}" />
