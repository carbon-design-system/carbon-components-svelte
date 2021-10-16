/// <reference types="svelte" />
import { SvelteComponentTyped } from "svelte";

export interface NotificationTextDetailsProps {
  /**
   * Set the type of notification
   * @default "toast"
   */
  notificationType?: "toast" | "inline";

  /**
   * Specify the title text
   * @default "Title"
   */
  title?: string;

  /**
   * Specify the subtitle text
   * @default ""
   */
  subtitle?: string;

  /**
   * Specify the caption text
   * @default "Caption"
   */
  caption?: string;
}

export default class NotificationTextDetails extends SvelteComponentTyped<
  NotificationTextDetailsProps,
  {},
  { default: {} }
> {}
