import type { Readable } from "svelte/store";
import type { IconComponent } from "../utils/icon-component.js";
import type { IconPickerItem } from "./icon-items.js";

/** The component to draw for an item, or `null` while it is still coming. */
export function resolveIcon(
  item: IconPickerItem | undefined,
  imported: ReadonlyMap<string, IconComponent>,
): IconComponent;

/** Imports the icons a picker shows, in batches, as they come on screen. */
export function createIconLoader(): {
  icons: Readable<ReadonlyMap<string, IconComponent>>;
  load: (items: ReadonlyArray<IconPickerItem>) => Promise<void>;
  destroy: () => void;
};
