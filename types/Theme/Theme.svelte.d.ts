import type { SvelteComponentTyped } from "svelte";

export type CarbonTheme = "white" | "g10" | "g80" | "g90" | "g100";

export interface ThemeProps {
  /**
   * Set the current Carbon theme
   * @default "white"
   */
  theme?: CarbonTheme;

  /**
   * Customize a theme with your own tokens
   * @see https://carbondesignsystem.com/guidelines/themes/overview#customizing-a-theme
   * @default {}
   */
  tokens?: { [token: string]: any };

  /**
   * Set to `true` to persist the theme using window.localStorage
   * @default false
   */
  persist?: boolean;

  /**
   * Specify the local storage key
   * @default "theme"
   */
  persistKey?: string;

  /**
   * Render a toggle or select dropdown to control the theme
   * @default undefined
   */
  render?: "toggle" | "select";

  /**
   * Override the default toggle props
   * @default { themes: ["white", "g100"], labelA: "", labelB: "", labelText: "Dark mode", hideLabel: false, }
   */
  toggle?: import("../Toggle/Toggle").ToggleProps & {
    themes?: [labelA: CarbonTheme, labelB: CarbonTheme];
  };

  /**
   * Override the default select props
   * @default { themes: themeKeys, labelText: "Themes", hideLabel: false, }
   */
  select?: import("../Select/Select").SelectProps & { themes?: CarbonTheme[] };
}

export default class Theme extends SvelteComponentTyped<
  ThemeProps,
  { update: CustomEvent<{ theme: CarbonTheme }> },
  { default: { theme: CarbonTheme } }
> {}
