import type { Readable, Writable } from "svelte/store";
import type { MotionParams } from "./transitions.js";

/**
 * A group of components that share a `Motion` setting.
 *
 * - `notification`: InlineNotification, ToastNotification, NotificationQueue.
 * - `menu`: Dropdown, ComboBox, MultiSelect, Menu, MenuButton, OverflowMenu.
 * - `tooltip`: Tooltip, Toggletip, Popover.
 * - `loading`: Loading, InlineLoading, ImageLoader.
 * - `panel`: HeaderAction, HeaderSwitcher, ProfileMenu.
 * - `collapse`: SideNavMenu.
 */
export type MotionRole =
  "notification" | "menu" | "tooltip" | "loading" | "panel" | "collapse";

/** The params every preset accepts. */
export type MotionSharedParams = Pick<
  MotionParams,
  "delay" | "duration" | "easing" | "mode" | "reducedMotion"
>;

/**
 * One `Motion` setting.
 *
 * - `undefined`: inherit from the enclosing `Motion`.
 * - `true` or `false`: on with the presets, or off.
 * - An object of shared params, such as `{ duration: "fast01" }`: on, with
 *   those params.
 */
export type MotionValue = undefined | boolean | MotionSharedParams;

/** The props of `Motion`: `transition` for every role, plus one per role. */
export type MotionSettings = { transition?: MotionValue } & Partial<
  Record<MotionRole, MotionValue>
>;

export function pickRole(
  settings: MotionSettings,
  role: MotionRole,
): MotionValue;

export function provideMotion(
  initial: MotionSettings,
): Writable<MotionSettings>;

export function getMotionDefault(role: MotionRole): Readable<MotionValue>;
