import type {
  Button as BarrelButton,
  DataTable as BarrelDataTable,
  breakpointObserver,
  breakpoints,
  dismiss,
  floatingPosition,
  formatFileSize,
  formReset,
  fuzzyMatch,
  getAvatarBackgroundColor,
  getInitials,
  preserveFocusSelection,
  queryParam,
  rovingFocus,
  trapFocus,
} from "carbon-components-svelte";
import type { BreakpointSize } from "carbon-components-svelte/src/Breakpoint/breakpoints.js";
import type Button from "carbon-components-svelte/src/Button/Button.svelte";
import type ComboBoxSkeleton from "carbon-components-svelte/src/ComboBox/ComboBoxSkeleton.svelte";
import type DataTable from "carbon-components-svelte/src/DataTable/DataTable.svelte";
import type { DataTableRow } from "carbon-components-svelte/src/DataTable/DataTable.svelte";
import type MultiSelectSkeleton from "carbon-components-svelte/src/MultiSelect/MultiSelectSkeleton.svelte";
import type {
  CarbonTheme,
  ThemeProps,
  themes,
} from "carbon-components-svelte/src/Theme/Theme.svelte";
import type TimePickerSkeleton from "carbon-components-svelte/src/TimePicker/TimePickerSkeleton.svelte";
import type { HeaderSearchResult } from "carbon-components-svelte/src/UIShell/HeaderSearch.svelte";
import type { DismissParams } from "carbon-components-svelte/src/utils/dismiss.js";
import type {
  FloatingPositionOptions,
  FloatingPositionResult,
} from "carbon-components-svelte/src/utils/floating-position.js";
import type { RovingFocusOptions } from "carbon-components-svelte/src/utils/roving-focus.js";

import "carbon-components-svelte/css/all.css";
import "carbon-components-svelte/css/g100.css";
import "carbon-components-svelte/css/g10.css";
import "carbon-components-svelte/css/g80.css";
import "carbon-components-svelte/css/g90.css";
import "carbon-components-svelte/css/white.css";

type _BarrelButton = BarrelButton;
type _BarrelDataTable = BarrelDataTable;
type _BreakpointObserver = ReturnType<typeof breakpointObserver>;
type _BreakpointSize = BreakpointSize;
type _Breakpoints = typeof breakpoints;
type _Button = Button;
type _CarbonTheme = CarbonTheme;
type _ComboBoxSkeleton = ComboBoxSkeleton;
type _DataTable = DataTable;
type _DataTableRow = DataTableRow<{ id: string; name: string }>;
type _FormatFileSize = ReturnType<typeof formatFileSize>;
type _FuzzyMatch = ReturnType<typeof fuzzyMatch>;
type _GetAvatarBackgroundColor = ReturnType<typeof getAvatarBackgroundColor>;
type _GetInitials = ReturnType<typeof getInitials>;
type _MultiSelectSkeleton = MultiSelectSkeleton;
type _QueryParam = ReturnType<typeof queryParam<string>>;
type _HeaderSearchResult = HeaderSearchResult;
type _ThemeProps = ThemeProps;
type _Themes = typeof themes;
type _TimePickerSkeleton = TimePickerSkeleton;
type _Dismiss = ReturnType<typeof dismiss>;
type _DismissParams = Parameters<typeof dismiss>[1];
type _DismissParamsType = DismissParams;
type _FloatingPosition = ReturnType<typeof floatingPosition>;
type _FloatingPositionOptions = FloatingPositionOptions;
type _FloatingPositionResult = FloatingPositionResult;
type _FormReset = ReturnType<typeof formReset>;
type _PreserveFocusSelection = ReturnType<typeof preserveFocusSelection>;
type _RovingFocus = ReturnType<typeof rovingFocus>;
type _RovingFocusOptions = RovingFocusOptions;
type _TrapFocus = ReturnType<typeof trapFocus>;
