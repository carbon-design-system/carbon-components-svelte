<script>
  /**
   * @restProps {div}
   * @slot {{}} - Extra content under the subtitle.
   * @slot {{}} titleChildren
   * @slot {{}} subtitleChildren
   * @slot {{}} actions - An action, such as a `NotificationActionButton`.
   */

  /**
   * Specify the kind of callout.
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"}
   */
  export let kind = "info";

  /** Set to `true` to use the low contrast variant */
  export let lowContrast = false;

  /**
   * Specify the title text.
   * Alternatively, use the named slot "titleChildren".
   */
  export let title = "";

  /**
   * Specify the subtitle text.
   * Alternatively, use the named slot "subtitleChildren", such as for a link.
   */
  export let subtitle = "";

  /**
   * Specify the id of the title element. A `NotificationActionButton` in
   * the callout is described by it. Point the `aria-describedby` of other
   * interactive content, such as a link, at the same id.
   */
  export let titleId = uniqueId();

  /**
   * Specify the label of the status icon for screen readers.
   * Defaults to the kind, such as "Warning".
   * @type {string | undefined}
   */
  export let statusIconDescription = undefined;

  /**
   * Set to `true` for the callout to fill its parent's width, without the
   * default width limits, as when it sits inside a tile or a form.
   */
  export let fullWidth = false;

  import { setContext } from "svelte";
  import { writable } from "svelte/store";
  import { uniqueId } from "../utils/unique-id.js";
  import NotificationIcon from "./NotificationIcon.svelte";
  import { statusIconLabel } from "./status-icon-label.js";

  const describedBy = writable(undefined);

  setContext("carbon:NotificationAction", { describedBy, toast: false });

  $: titled = Boolean(title || $$slots.titleChildren);
  $: describedBy.set(titled ? titleId : undefined);
</script>

<div
  class:bx--inline-notification={true}
  class:bx--inline-notification--callout={true}
  class:bx--inline-notification--hide-close-button={true}
  class:bx--inline-notification--low-contrast={lowContrast}
  class:bx--inline-notification--high-contrast={!lowContrast}
  class:bx--inline-notification--full-width={fullWidth}
  class:bx--inline-notification--error={kind === "error"}
  class:bx--inline-notification--low-contrast-error={lowContrast &&
    kind === "error"}
  class:bx--inline-notification--info={kind === "info"}
  class:bx--inline-notification--low-contrast-info={lowContrast &&
    kind === "info"}
  class:bx--inline-notification--info-square={kind === "info-square"}
  class:bx--inline-notification--low-contrast-info-square={lowContrast &&
    kind === "info-square"}
  class:bx--inline-notification--success={kind === "success"}
  class:bx--inline-notification--low-contrast-success={lowContrast &&
    kind === "success"}
  class:bx--inline-notification--warning={kind === "warning"}
  class:bx--inline-notification--low-contrast-warning={lowContrast &&
    kind === "warning"}
  class:bx--inline-notification--warning-alt={kind === "warning-alt"}
  class:bx--inline-notification--low-contrast-warning-alt={lowContrast &&
    kind === "warning-alt"}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave
>
  <div class:bx--inline-notification__details={true}>
    <NotificationIcon
      notificationType="inline"
      {kind}
      {lowContrast}
      iconDescription={statusIconDescription || statusIconLabel(kind)}
    />
    <div class:bx--inline-notification__text-wrapper={true}>
      {#if titled}
        <p id={titleId} class:bx--inline-notification__title={true}>
          <strong><slot name="titleChildren">{title}</slot></strong>
        </p>
      {/if}
      {#if subtitle || $$slots.subtitleChildren}
        <div class:bx--inline-notification__subtitle={true}>
          <slot name="subtitleChildren">{subtitle}</slot>
        </div>
      {/if}
      <slot />
    </div>
  </div>
  <slot name="actions" />
</div>
