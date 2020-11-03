/// <reference types="svelte" />

export default class NotificationTextDetails {
  $$prop_def: {
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
  };

  $$slot_def: {
    default: {};
  };

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
