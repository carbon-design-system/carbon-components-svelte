<script>
  /**
   * Specify the kind of notification icon.
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"}
   */
  export let kind = "error";

  /**
   * Set the type of notification.
   * @type {"toast" | "inline"}
   */
  export let notificationType = "toast";

  /** Set to `true` to use the low contrast icon fill. */
  export let lowContrast = false;

  /**
   * Specify a label for screen readers, such as "Warning". Leave it unset
   * to hide the icon from screen readers.
   * @type {string | undefined}
   */
  export let iconDescription = undefined;

  import BuiltinCheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import BuiltinErrorFilled from "../icons/ErrorFilled.svelte";
  import BuiltinInformationFilled from "../icons/InformationFilled.svelte";
  import BuiltinInformationSquareFilled from "../icons/InformationSquareFilled.svelte";
  import BuiltinWarningAltFilled from "../icons/WarningAltFilled.svelte";
  import BuiltinWarningFilled from "../icons/WarningFilled.svelte";
  import { getIconContext } from "../utils/icon-context.js";

  const {
    CheckmarkFilled = BuiltinCheckmarkFilled,
    ErrorFilled = BuiltinErrorFilled,
    InformationFilled = BuiltinInformationFilled,
    InformationSquareFilled = BuiltinInformationSquareFilled,
    WarningAltFilled = BuiltinWarningAltFilled,
    WarningFilled = BuiltinWarningFilled,
  } = getIconContext();

  const icons = {
    error: ErrorFilled,
    "info-square": InformationSquareFilled,
    info: InformationFilled,
    success: CheckmarkFilled,
    warning: WarningFilled,
    "warning-alt": WarningAltFilled,
  };

  $: marker = `${lowContrast ? "low-contrast-" : ""}${kind}`;

  $: iconClass =
    notificationType === "toast"
      ? `bx--toast-notification__icon bx--toast-notification__icon--${marker}`
      : notificationType === "inline"
        ? `bx--inline-notification__icon bx--inline-notification__icon--${marker}`
        : "";
</script>

<svelte:component
  this={icons[kind]}
  size={20}
  class={iconClass}
  title={iconDescription}
/>
