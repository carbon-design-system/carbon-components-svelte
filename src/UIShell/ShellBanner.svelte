<script>
  /**
   * @event close
   * @property {string | undefined} dismissId
   * @restProps {section}
   * @slot {{}} - Extra content under the subtitle.
   * @slot {{}} titleChildren
   * @slot {{}} subtitleChildren
   * @slot {{}} actions - An action, such as a `NotificationActionButton`.
   */

  /**
   * Specify the kind of banner.
   * @type {"error" | "info" | "info-square" | "success" | "warning" | "warning-alt"}
   */
  export let kind = "info";

  /**
   * Specify the title text.
   * Alternatively, use the named slot "titleChildren".
   */
  export let title = "";

  /**
   * Specify the subtitle text.
   * Alternatively, use the named slot "subtitleChildren".
   */
  export let subtitle = "";

  /**
   * Specify where the banner sits. `"above-header"` is fixed to the top of
   * the viewport and moves the `Header`, `SideNav` and header panels down
   * by its height through `--ccs-shell-offset`. Mount one at a time.
   * `"content"` is a strip that renders as the first child of `Content`, so
   * it follows the side nav's width and the text direction.
   * @type {"above-header" | "content"}
   */
  export let placement = "content";

  /**
   * Set to `true` to stick a `"content"` banner under the header while the
   * page scrolls. Has no effect on an `"above-header"` banner.
   */
  export let sticky = false;

  /**
   * Set to `true` for a 4px strip with only the title, hanging below it.
   * Give it a `title`: the kind is announced to screen readers, but the
   * color is the only visual signal.
   */
  export let thin = false;

  /** Set to `false` to use the high contrast variant */
  export let lowContrast = true;

  /** Set to `true` to show a close button */
  export let dismissible = false;

  /**
   * Remember that the banner was dismissed in `localStorage`, under the key
   * `ccs-shell-banner:{dismissId}`. It stays closed on later visits and in
   * other tabs until the id changes, so give each announcement its own id.
   * The server cannot read it: a dismissed banner is in the server markup
   * and closes once the page mounts. To avoid that, set `open` to `false`
   * from a cookie on the server.
   * @type {string | undefined}
   */
  export let dismissId = undefined;

  /** Specify the ARIA label for the close button */
  export let closeButtonDescription = "Dismiss banner";

  /** Specify the name of the banner's landmark region */
  export let label = "Site announcement";

  /**
   * Set to `true` for a banner that appears while the page is open, so a
   * screen reader announces it (`role="status"`). A banner that is there at
   * load stays a plain region. The banner never uses `role="alert"`.
   */
  export let announce = false;

  /**
   * Specify the label of the status icon for screen readers.
   * Defaults to the kind, such as "Warning".
   * @type {string | undefined}
   */
  export let statusIconDescription = undefined;

  /**
   * Specify the id of the title element. A `NotificationActionButton` in
   * the banner is described by it.
   */
  export let titleId = uniqueId();

  /**
   * Set to `false` to hide the banner, or to show it again.
   * @bindable writable
   */
  export let open = true;

  /**
   * Obtain a reference to the banner element.
   * @type {null | HTMLElement}
   * @bindable readonly
   */
  export let ref = null;

  import { createEventDispatcher, onMount, setContext, tick } from "svelte";
  import { writable } from "svelte/store";
  import StorageBinding from "../LocalStorage/StorageBinding.svelte";
  import NotificationButton from "../Notification/NotificationButton.svelte";
  import NotificationIcon from "../Notification/NotificationIcon.svelte";
  import { statusIconLabel } from "../Notification/status-icon-label.js";
  import { NOTIFICATION_QUEUE_COLLAPSE_MS } from "../constants/timing.js";
  import { splitAriaNaming } from "../utils/aria-naming.js";
  import { returnFocus } from "../utils/focus.js";
  import { observeResize } from "../utils/shared-observer.js";
  import { uniqueId } from "../utils/unique-id.js";
  import { addPooledListener } from "../utils/window-listener-pool.js";

  const dispatch = createEventDispatcher();
  const owner = uniqueId();

  // A single-line banner is 2.5rem (a thin one 0.25rem), so the server
  // markup reserves that much before the page measures the real height.
  const estimate = { fat: "2.5rem", thin: "0.25rem" };

  /** @type {import("svelte/store").Writable<string | undefined>} */
  const describedBy = writable(undefined);

  setContext("carbon:NotificationAction", { describedBy, toast: false });

  let mounted = false;
  let dismissed = false;
  /** @type {null | HTMLElement} */
  let prevFocus = null;
  /** @type {() => void} */
  let stopOffset = () => {};
  // Closed by a mouse or pen over the banner: the empty banner keeps its
  // space until the pointer leaves it or the page scrolls, so the shell
  // does not move under the pointer.
  let held = false;
  let pointerType = "";
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let releaseTimer;
  /** @type {() => void} */
  let stopScrollRelease = () => {};

  $: aboveHeader = placement === "above-header";
  $: titled = Boolean(title || $$slots.titleChildren);
  $: describedBy.set(titled ? titleId : undefined);
  $: ({ ariaLabel, ariaLabelledBy, ariaDescribedBy, rest } =
    splitAriaNaming($$restProps));
  $: if (dismissed) open = false;
  $: syncOffset(mounted && (open || held) && aboveHeader ? ref : null);
  $: if (open && held) release();

  /**
   * Publish the banner's height as `--ccs-shell-offset` on `<html>`, which
   * the fixed shell parts read. Only the banner that set the property
   * clears it.
   * @param {null | HTMLElement} node
   */
  function syncOffset(node) {
    stopOffset();
    if (!node) {
      stopOffset = () => {};
      return;
    }
    const root = document.documentElement;
    /** @param {number} height */
    const publish = (height) => {
      root.style.setProperty("--ccs-shell-offset", `${height}px`);
      root.dataset.ccsShellBanner = owner;
    };
    publish(node.getBoundingClientRect().height);
    const stop = observeResize(node, () =>
      publish(node.getBoundingClientRect().height),
    );
    stopOffset = () => {
      stop();
      if (root.dataset.ccsShellBanner !== owner) return;
      root.style.removeProperty("--ccs-shell-offset");
      delete root.dataset.ccsShellBanner;
    };
  }

  /** @param {FocusEvent} event */
  function handleFocusIn(event) {
    const from = event.relatedTarget;
    if (!(from instanceof Node && ref?.contains(from))) {
      prevFocus = from instanceof HTMLElement ? from : null;
    }
  }

  function release() {
    clearTimeout(releaseTimer);
    stopScrollRelease();
    stopScrollRelease = () => {};
    held = false;
  }

  function handlePointerLeave() {
    if (!held) return;
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(release, NOTIFICATION_QUEUE_COLLAPSE_MS);
  }

  function close() {
    if (!dispatch("close", { dismissId }, { cancelable: true })) return;
    const hadFocus = !!ref?.contains(document.activeElement);
    const target = prevFocus;
    // Touch has no hover, and a keyboard close has no pointer to protect.
    if (pointerType && pointerType !== "touch" && ref?.matches(":hover")) {
      held = true;
      stopScrollRelease = addPooledListener("scroll", release, {
        capture: true,
        passive: true,
      });
    }
    open = false;
    if (dismissId) dismissed = true;
    prevFocus = null;
    // The banner unmounts with its close button focused. Send focus back
    // to where it came from, else to `Content`, which takes focus when it
    // has a `tabindex`, as a skip link's target does.
    if (!hadFocus) return;
    tick().then(() => {
      returnFocus(
        target?.isConnected
          ? target
          : document.querySelector("main.bx--content[tabindex]"),
      );
    });
  }

  onMount(() => {
    mounted = true;
    return () => {
      stopOffset();
      clearTimeout(releaseTimer);
      stopScrollRelease();
    };
  });
</script>

{#if dismissId}
  <StorageBinding
    storageType="localStorage"
    key="ccs-shell-banner:{dismissId}"
    bind:value={dismissed}
  />
{/if}

<svelte:head>
  {#if open && aboveHeader}
    {@html `<style>:root{--ccs-shell-offset:${thin ? estimate.thin : estimate.fat}}</style>`}
  {/if}
</svelte:head>

{#if open || held}
  <section
    bind:this={ref}
    role={announce && !held ? "status" : undefined}
    aria-hidden={held ? "true" : undefined}
    aria-label={ariaLabel ?? label}
    aria-labelledby={ariaLabelledBy}
    aria-describedby={ariaDescribedBy}
    class:bx--shell-banner={true}
    class:bx--shell-banner--above-header={aboveHeader}
    class:bx--shell-banner--content={!aboveHeader}
    class:bx--shell-banner--sticky={sticky && !aboveHeader}
    class:bx--shell-banner--thin={thin}
    class:bx--shell-banner--held={held}
    class:bx--shell-banner--low-contrast={lowContrast && !held}
    class:bx--shell-banner--high-contrast={!lowContrast && !held}
    class:bx--shell-banner--error={kind === "error"}
    class:bx--shell-banner--info={kind === "info" || kind === "info-square"}
    class:bx--shell-banner--success={kind === "success"}
    class:bx--shell-banner--warning={kind === "warning" ||
      kind === "warning-alt"}
    {...rest}
    on:click
    on:focusin={handleFocusIn}
    on:pointerdown={(event) => {
      pointerType = event.pointerType;
    }}
    on:pointerenter={() => clearTimeout(releaseTimer)}
    on:pointerleave={handlePointerLeave}
  >
    <div class:bx--shell-banner__body={true}>
      <div class:bx--shell-banner__details={true}>
        {#if thin}
          <span class:bx--visually-hidden={true}
            >{statusIconDescription || statusIconLabel(kind)}:</span
          >
        {:else}
          <NotificationIcon
            notificationType="inline"
            {kind}
            {lowContrast}
            iconDescription={statusIconDescription || statusIconLabel(kind)}
          />
        {/if}
        <!-- The action follows the text in one wrapping row, so in a narrow
        banner it moves under the text instead of squeezing it. -->
        <div class:bx--shell-banner__content={true}>
          <div class:bx--shell-banner__text={true}>
            {#if titled}
              <p id={titleId} class:bx--shell-banner__title={true}>
                <slot name="titleChildren">{title}</slot>
              </p>
            {/if}
            {#if !thin}
              {#if subtitle || $$slots.subtitleChildren}
                <div class:bx--shell-banner__subtitle={true}>
                  <slot name="subtitleChildren">{subtitle}</slot>
                </div>
              {/if}
              <slot />
            {/if}
          </div>
          {#if !thin}
            <slot name="actions" />
          {/if}
        </div>
      </div>
      {#if dismissible}
        <NotificationButton
          notificationType="inline"
          {lowContrast}
          iconDescription={closeButtonDescription}
          on:click={close}
        />
      {/if}
    </div>
  </section>
{/if}
