import type {
  breakpointObserver,
  breakpoints,
  Button as BarrelButton,
  captureFocusTarget,
  createAsyncSource,
  createIdScope,
  createPagedSource,
  createTheme,
  DataTable as BarrelDataTable,
  dismiss,
  Flag as BarrelFlag,
  floatingPosition,
  focusHandoff,
  formatFileSize,
  formReset,
  fuzzyMatch,
  getAvatarBackgroundColor,
  getInitials,
  getLayoutDirection,
  preserveFocusSelection,
  queryParam,
  rovingFocus,
  setTranslateContext,
  sticky,
  themeScript,
  ThemeZone as BarrelThemeZone,
  trapFocus,
  useId,
} from "carbon-components-svelte";
import { type FlagData, JP } from "carbon-components-svelte/flags";
import { flags, getFlag } from "carbon-components-svelte/flags/all";
import {
  collapse,
  type CollapseOptions,
  duration,
  type DurationToken,
  easing,
  easingCss,
  fade,
  flip,
  fly,
  type FlyParams,
  motion,
  type MotionMode,
  prefersReducedMotion,
  shouldReduceMotion,
  slide,
  type SlideParams,
  type TransitionProp,
} from "carbon-components-svelte/motion";
import type { BreakpointSize } from "carbon-components-svelte/src/Breakpoint/breakpoints.js";
import type Button from "carbon-components-svelte/src/Button/Button.svelte";
import type ComboBoxSkeleton from "carbon-components-svelte/src/ComboBox/ComboBoxSkeleton.svelte";
import type DataTable from "carbon-components-svelte/src/DataTable/DataTable.svelte";
import type { DataTableRow } from "carbon-components-svelte/src/DataTable/DataTable.svelte";
import type LayoutDirection from "carbon-components-svelte/src/LayoutDirection/LayoutDirection.svelte";
import type { LayoutDirectionProps } from "carbon-components-svelte/src/LayoutDirection/LayoutDirection.svelte";
import type MultiSelectSkeleton from "carbon-components-svelte/src/MultiSelect/MultiSelectSkeleton.svelte";
import type {
  CarbonTheme,
  ThemeProps,
  themes,
} from "carbon-components-svelte/src/Theme/Theme.svelte";
import type {
  ContrastWarning,
  CreateThemeOptions,
  CreateThemeResult,
} from "carbon-components-svelte/src/Theme/create-theme.js";
import type ThemeZone from "carbon-components-svelte/src/ThemeZone/ThemeZone.svelte";
import type { ThemeZoneProps } from "carbon-components-svelte/src/ThemeZone/ThemeZone.svelte";
import type TimePickerSkeleton from "carbon-components-svelte/src/TimePicker/TimePickerSkeleton.svelte";
import type { HeaderSearchResult } from "carbon-components-svelte/src/UIShell/HeaderSearch.svelte";
import type {
  AsyncSource,
  AsyncState,
  PagedSource,
} from "carbon-components-svelte/src/utils/async-source.js";
import type { DismissParams } from "carbon-components-svelte/src/utils/dismiss.js";
import type {
  FloatingPositionOptions,
  FloatingPositionResult,
} from "carbon-components-svelte/src/utils/floating-position.js";
import type { RovingFocusOptions } from "carbon-components-svelte/src/utils/roving-focus.js";
import type { StickyOptions } from "carbon-components-svelte/src/utils/sticky.js";
import {
  highlight,
  highlightCode,
  type Token,
  tokenize,
  type TokenType,
} from "carbon-components-svelte/syntax";
import type {
  ColorToken,
  colorTokens,
  TypeToken,
  typeTokens,
} from "carbon-components-svelte/tokens";

import "carbon-components-svelte/css/all.css";
import "carbon-components-svelte/css/g100.css";
import "carbon-components-svelte/css/g10.css";
import "carbon-components-svelte/css/g80.css";
import "carbon-components-svelte/css/g90.css";
import "carbon-components-svelte/css/prose-g100.css";
import "carbon-components-svelte/css/prose.css";
import "carbon-components-svelte/css/syntax-tokens-g100.css";
import "carbon-components-svelte/css/syntax-tokens.css";
import "carbon-components-svelte/css/syntax.css";
import "carbon-components-svelte/css/white.css";

type _BarrelButton = BarrelButton;
type _BarrelDataTable = BarrelDataTable;
type _BreakpointObserver = ReturnType<typeof breakpointObserver>;
type _BreakpointSize = BreakpointSize;
type _Breakpoints = typeof breakpoints;
type _Button = Button;
type _AsyncSource = ReturnType<typeof createAsyncSource<string[]>>;
type _AsyncSourceIsStore = AsyncSource<string[]>;
type _AsyncState = AsyncState<string[]>["status"];
type _PagedSource = ReturnType<typeof createPagedSource<number>>;
type _PagedSourceType = PagedSource<number>;
type _CarbonTheme = CarbonTheme;
type _ComboBoxSkeleton = ComboBoxSkeleton;
type _ContrastWarning = ContrastWarning;
type _CreateTheme = ReturnType<typeof createTheme>;
type _CreateThemeOptions = CreateThemeOptions;
type _CreateThemeResult = CreateThemeResult;
type _DataTable = DataTable;
type _DataTableRow = DataTableRow<{ id: string; name: string }>;
type _FormatFileSize = ReturnType<typeof formatFileSize>;
type _FuzzyMatch = ReturnType<typeof fuzzyMatch>;
type _GetAvatarBackgroundColor = ReturnType<typeof getAvatarBackgroundColor>;
type _GetInitials = ReturnType<typeof getInitials>;
type _GetLayoutDirection = ReturnType<typeof getLayoutDirection>;
type _SetTranslateContext = Parameters<typeof setTranslateContext>[0];
type _LayoutDirection = LayoutDirection;
type _LayoutDirectionProps = LayoutDirectionProps<"section">["dir"];
type _MultiSelectSkeleton = MultiSelectSkeleton;
type _QueryParam = ReturnType<typeof queryParam<string>>;
type _HeaderSearchResult = HeaderSearchResult;
type _BarrelFlag = BarrelFlag;
type _ThemeProps = ThemeProps;
type _ColorTokenValue = (typeof colorTokens)[ColorToken]["g100"];
type _TypeTokenSize = (typeof typeTokens)[TypeToken]["font-size"];
type _ThemeScript = ReturnType<typeof themeScript>;
type _Themes = typeof themes;
type _BarrelThemeZone = BarrelThemeZone;
type _ThemeZone = ThemeZone;
type _ThemeZoneProps = ThemeZoneProps<"aside">["theme"];
type _TimePickerSkeleton = TimePickerSkeleton;
type _Dismiss = ReturnType<typeof dismiss>;
type _DismissParams = Parameters<typeof dismiss>[1];
type _DismissParamsType = DismissParams;
type _FloatingPosition = ReturnType<typeof floatingPosition>;
type _FloatingPositionOptions = FloatingPositionOptions;
type _FloatingPositionResult = FloatingPositionResult;
type _CaptureFocusTarget = ReturnType<typeof captureFocusTarget>;
type _FocusHandoff = ReturnType<typeof focusHandoff>;
type _FormReset = ReturnType<typeof formReset>;
type _PreserveFocusSelection = ReturnType<typeof preserveFocusSelection>;
type _RovingFocus = ReturnType<typeof rovingFocus>;
type _RovingFocusOptions = RovingFocusOptions;
type _Sticky = ReturnType<typeof sticky>;
type _StickyOptions = StickyOptions;
type _TrapFocus = ReturnType<typeof trapFocus>;
type _CreateIdScope = ReturnType<typeof createIdScope>;
type _UseId = ReturnType<typeof useId>;

const _tokens: Token[] | undefined = tokenize("let a", "js");
const _type: TokenType | null | undefined = _tokens?.[0]?.type;
const _html: string | undefined = highlight("let a", "js");
const _action: { destroy: () => void } = highlightCode(document.body, {
  language: "js",
});

const _duration: DurationToken = "moderate02";
const _ms: number = duration[_duration];
const _mode: MotionMode = "expressive";
const _ease: number = easing.exit[_mode](0.5);
const _css: string = easingCss.standard.productive;
const _motion: string = motion("entrance", _mode);
const _reduce: boolean = shouldReduceMotion();
const _reduceStore: () => void = prefersReducedMotion.subscribe(
  (_v: boolean) => {},
);
const _flyParams: FlyParams = { x: 32, y: "1rem", collapse: true };
const _fade: number | undefined = fade(document.body, {
  duration: "fast02",
  easing: "exit",
  reducedMotion: "ignore",
}).duration;
const _slide: number | undefined = slide(document.body, { axis: "x" }).duration;
const _fly: number | undefined = fly(document.body, _flyParams).duration;
const _collapseOptions: CollapseOptions = { open: false, duration: "fast02" };
const _collapse: () => void = collapse(document.body, _collapseOptions).destroy;
const _flip: number | undefined = flip(
  document.body,
  { from: new DOMRect(), to: new DOMRect() },
  { duration: (distance) => distance },
).duration;
const _transitionProps: TransitionProp<SlideParams>[] = [
  undefined,
  true,
  false,
  {},
  { duration: "slow01", axis: "x" },
  { fn: fly, y: 8 },
];
const _flag: FlagData = JP;
const _flagByCode: FlagData | undefined = getFlag("JP");
const _flagCode: string = flags.JP.code;
