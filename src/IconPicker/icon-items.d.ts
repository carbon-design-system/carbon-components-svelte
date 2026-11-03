import type { IconComponent } from "../utils/icon-component.js";

/** Imports an icon on demand: `import.meta.glob` gives one for each file. */
export type IconLoader = () => Promise<
  IconComponent | { default: IconComponent }
>;

export type IconPickerItem = {
  /** The icon's name. It is the `value` of the picker. */
  id: string;
  /** What search matches and assistive technology reads, such as "Add alt". */
  label: string;
  /** The `id` of the category the icon belongs to. */
  category?: string;
  /** More words search matches. */
  keywords?: ReadonlyArray<string>;
  /** The icon, when it is already imported. */
  icon?: IconComponent;
  /** Imports the icon on demand, as the picker needs it on screen. Not called when `icon` is set. */
  load?: IconLoader;
};

/** "AddAlt" to "Add alt", "UIShell" to "UI shell". */
export function iconLabel(name: string): string;

/**
 * Turn the icons a bundler hands over into `IconPickerItem`s, named by the
 * file or the key. A value can be an imported icon, a module, or a loader
 * (`import.meta.glob` on its own), which keeps the icon out of the bundle
 * until the picker shows it.
 */
export function toIconItems(
  source: Record<string, unknown>,
  options?: {
    /** Sort an icon into a category. */
    category?: (id: string, label: string) => string | undefined;
  },
): IconPickerItem[];
