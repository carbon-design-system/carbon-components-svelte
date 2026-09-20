import type {
  Button as BarrelButton,
  DataTable as BarrelDataTable,
  breakpointObserver,
  breakpoints,
  fuzzyMatch,
  getAvatarBackgroundColor,
  getInitials,
} from "carbon-components-svelte";
import type { BreakpointSize } from "carbon-components-svelte/src/Breakpoint/breakpoints.js";
import type Button from "carbon-components-svelte/src/Button/Button.svelte";
import type DataTable from "carbon-components-svelte/src/DataTable/DataTable.svelte";
import type { DataTableRow } from "carbon-components-svelte/src/DataTable/DataTable.svelte";
import type {
  CarbonTheme,
  ThemeProps,
  themes,
} from "carbon-components-svelte/src/Theme/Theme.svelte";
import type { HeaderSearchResult } from "carbon-components-svelte/src/UIShell/HeaderSearch.svelte";
import type {
  scaleLinear,
  Chart as VizChart,
  DeltaIndicator as VizDeltaIndicator,
  FunnelBars as VizFunnelBars,
  vizColor,
} from "carbon-components-svelte/viz";

import "carbon-components-svelte/css/all.css";
import "carbon-components-svelte/css/g100.css";
import "carbon-components-svelte/css/g10.css";
import "carbon-components-svelte/css/g80.css";
import "carbon-components-svelte/css/g90.css";
import "carbon-components-svelte/css/viz.css";
import "carbon-components-svelte/css/viz-g10.css";
import "carbon-components-svelte/css/viz-g100.css";
import "carbon-components-svelte/css/viz-g80.css";
import "carbon-components-svelte/css/viz-g90.css";
import "carbon-components-svelte/css/viz-white.css";
import "carbon-components-svelte/css/white.css";

type _BarrelButton = BarrelButton;
type _BarrelDataTable = BarrelDataTable;
type _BreakpointObserver = ReturnType<typeof breakpointObserver>;
type _BreakpointSize = BreakpointSize;
type _Breakpoints = typeof breakpoints;
type _Button = Button;
type _CarbonTheme = CarbonTheme;
type _DataTable = DataTable;
type _DataTableRow = DataTableRow<{ id: string; name: string }>;
type _FuzzyMatch = ReturnType<typeof fuzzyMatch>;
type _GetAvatarBackgroundColor = ReturnType<typeof getAvatarBackgroundColor>;
type _GetInitials = ReturnType<typeof getInitials>;
type _HeaderSearchResult = HeaderSearchResult;
type _ThemeProps = ThemeProps;
type _Themes = typeof themes;
type _VizChart = VizChart<{ date: Date; value: number }>;
type _VizColor = ReturnType<typeof vizColor>;
type _VizDeltaIndicator = VizDeltaIndicator;
type _VizFunnelBars = VizFunnelBars<"a" | "b">;
type _VizScaleLinear = ReturnType<typeof scaleLinear>;
