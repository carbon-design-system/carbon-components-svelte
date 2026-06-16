import type {
  Button as BarrelButton,
  DataTable as BarrelDataTable,
  breakpoint,
  breakpointObserver,
  breakpoints,
  colorScheme,
  containerQuery,
  mediaQuery,
  prefersContrast,
  prefersDarkMode,
  prefersReducedMotion,
} from "carbon-components-svelte";
import type breakpointObserverDefault from "carbon-components-svelte/src/Breakpoint/breakpointObserver.js";
import type { BreakpointSize } from "carbon-components-svelte/src/Breakpoint/breakpoints.js";
import type Button from "carbon-components-svelte/src/Button/Button.svelte";
import type DataTable from "carbon-components-svelte/src/DataTable/DataTable.svelte";
import type { DataTableRow } from "carbon-components-svelte/src/DataTable/DataTable.svelte";
import type {
  ColorSchemeOptions,
  ColorSchemePreference,
  ResolvedColorScheme,
} from "carbon-components-svelte/src/stores/colorScheme.js";
import type containerQueryDefault from "carbon-components-svelte/src/stores/containerQuery.js";
import type mediaQueryDefault from "carbon-components-svelte/src/stores/mediaQuery.js";
import type {
  CarbonTheme,
  ThemeProps,
  themes,
} from "carbon-components-svelte/src/Theme/Theme.svelte";
import type { HeaderSearchResult } from "carbon-components-svelte/src/UIShell/HeaderSearch.svelte";

import "carbon-components-svelte/css/all.css";
import "carbon-components-svelte/css/g100.css";
import "carbon-components-svelte/css/g10.css";
import "carbon-components-svelte/css/g80.css";
import "carbon-components-svelte/css/g90.css";
import "carbon-components-svelte/css/white.css";

type _BarrelButton = BarrelButton;
type _BarrelDataTable = BarrelDataTable;
type _BreakpointObserver = ReturnType<typeof breakpointObserver>;
type _BreakpointObserverDefault = typeof breakpointObserverDefault;
type _BreakpointSize = BreakpointSize;
type _Breakpoints = typeof breakpoints;
type _Button = Button;
type _CarbonTheme = CarbonTheme;
type _DataTable = DataTable;
type _DataTableRow = DataTableRow<{ id: string; name: string }>;
type _HeaderSearchResult = HeaderSearchResult;
type _ThemeProps = ThemeProps;
type _Themes = typeof themes;
type _MediaQuery = typeof mediaQuery;
type _MediaQueryDefault = typeof mediaQueryDefault;
type _PrefersDarkMode = typeof prefersDarkMode;
type _PrefersReducedMotion = typeof prefersReducedMotion;
type _PrefersContrast = typeof prefersContrast;
type _Breakpoint = typeof breakpoint;
type _ContainerQuery = typeof containerQuery;
type _ContainerQueryDefault = typeof containerQueryDefault;
type _ColorScheme = typeof colorScheme;
type _ColorSchemeOptions = ColorSchemeOptions;
type _ColorSchemePreference = ColorSchemePreference;
type _ResolvedColorScheme = ResolvedColorScheme;
