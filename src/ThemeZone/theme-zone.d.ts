import type { Readable } from "svelte/store";
import type { CarbonTheme } from "../Theme/Theme.svelte";

/**
 * The class that gives an element a theme's full token set in `all.css`.
 */
export declare const themeZoneClasses: Record<CarbonTheme, string>;

/**
 * The theme class of the nearest `ThemeZone`, for content a component
 * portals out of it. `undefined` outside a zone. Call during component
 * initialization.
 */
export declare function getThemeZoneClass(): Readable<string | undefined>;
