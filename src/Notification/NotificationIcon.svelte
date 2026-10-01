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

  import CheckmarkFilled from "../icons/CheckmarkFilled.svelte";
  import ErrorFilled from "../icons/ErrorFilled.svelte";
  import InformationFilled from "../icons/InformationFilled.svelte";
  import InformationSquareFilled from "../icons/InformationSquareFilled.svelte";
  import WarningAltFilled from "../icons/WarningAltFilled.svelte";
  import WarningFilled from "../icons/WarningFilled.svelte";

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

<svelte:component this={icons[kind]} size={20} class={iconClass} />
