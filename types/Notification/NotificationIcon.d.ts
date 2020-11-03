/// <reference types="svelte" />

export default class NotificationIcon {
  $$prop_def: {
    /**
     * Specify the kind of notification icon
     * @default "error"
     */
    kind?: "error" | "info" | "info-square" | "success" | "warning" | "warning-alt";

    /**
     * Set the type of notification
     * @default "toast"
     */
    notificationType?: "toast" | "inline";

    /**
     * Specify the ARIA label for the icon
     * @default "Closes notification"
     */
    iconDescription?: string;
  };

  $$slot_def: {};

  $on(eventname: string, cb: (event: Event) => void): () => void;
}
