<script>
  /**
   * A widget in a `DashboardGrid`: a card with a header that holds the drag
   * handle, and a body for the content. The body is a `Layer`, so fields and
   * tiles in it sit on the next surface. A press in the body is the
   * content's own, so tables, charts and fields keep working: only the
   * handle and the resize edges start a drag.
   *
   * @restProps {div}
   * @slot {{}}
   * @slot {{}} header - The header's content, in place of `titleText`. Give the widget an accessible name with `aria-label` when you use it.
   * @slot {{}} actions - Buttons at the header's inline end.
   */

  /**
   * Specify the id that places the widget: the `id` of one item of the
   * grid's layout.
   * @type {string}
   */
  export let id;

  /**
   * Specify the widget's title, which names it and its drag handle.
   * It renders as a `Heading`, one level below the nearest `Section`.
   * @type {string | undefined}
   */
  export let titleText = undefined;

  /**
   * Set to `true` to remove the body's padding, for content with its own
   * spacing, such as a table or a chart. Named `noPadding` as on `CardBody`.
   */
  export let noPadding = false;

  /**
   * Obtain a reference to the widget's grid cell.
   * @type {null | HTMLDivElement}
   * @bindable readonly
   */
  export let ref = null;

  import { getContext, onMount } from "svelte";
  import { readable } from "svelte/store";
  import Card from "../Card/Card.svelte";
  import Heading from "../Heading/Heading.svelte";
  import Layer from "../Layer/Layer.svelte";
  import Draggable from "../icons/Draggable.svelte";
  import { pointerDrag } from "../utils/pointer-drag.js";
  import { observeResize } from "../utils/shared-observer.js";

  /**
   * Set by `DashboardGrid`. Outside one, the widget is a plain card.
   * @type {import("./types.js").DashboardGridContext | undefined}
   */
  const grid = getContext("carbon:DashboardGrid");

  const items = grid?.items ?? readable(new Map());
  const options =
    grid?.options ?? readable({ draggable: false, resizable: false });
  const texts =
    grid?.texts ??
    readable({ handleLabelText: () => "", instructionsId: "", gridId: "" });
  const interaction = grid?.interaction ?? readable(null);

  /** @type {null | HTMLElement} */
  let frame = null;
  /** @type {null | HTMLButtonElement} */
  let handle = null;

  $: info = $items.get(id);
  $: label = titleText ?? $$restProps["aria-label"] ?? id;
  $: grid?.setLabel(id, label);
  $: lifted = $interaction?.id === id;
  $: placeholder = lifted && $interaction?.source === "pointer";
  $: movable = !info?.locked && ($options.draggable || $options.resizable);
  $: sizable = !info?.locked && $options.resizable;
  // From the grid's id and the widget's, so the server and the browser agree.
  // The widget's id is the consumer's, and a space would split the reference.
  $: titleId =
    id === undefined
      ? undefined
      : `${$texts.gridId}-title-${String(id).replace(/\s+/g, "_")}`;

  $: style = [info?.style, $$restProps.style].filter(Boolean).join(";");

  // A body that scrolls is a tab stop, so a keyboard user can scroll it.
  let scrollable = false;

  onMount(() => {
    if (!ref || !frame) return;
    const body = frame.querySelector(".bx--dashboard-grid__body");
    const stopObserving = body
      ? observeResize(body, () => {
          scrollable =
            body.scrollHeight > body.clientHeight + 1 ||
            body.scrollWidth > body.clientWidth + 1;
        })
      : undefined;
    const unregister = grid?.register(id, {
      root: ref,
      frame,
      get handle() {
        return handle;
      },
    });
    return () => {
      stopObserving?.();
      unregister?.();
    };
  });

  /**
   * @param {"move" | "resize"} mode
   * @param {import("./types.js").DashboardGridEdge | null} edge
   * @param {{ draggable: boolean; resizable: boolean }} allowed - Passed in so
   *   the action's options follow the grid's.
   * @returns {import("../utils/pointer-drag.js").PointerDragOptions}
   */
  function dragOptions(mode, edge, allowed) {
    return {
      enabled: mode === "move" ? allowed.draggable : allowed.resizable,
      onStart: (event) =>
        ref !== null &&
        frame !== null &&
        Boolean(grid?.pointerStart(id, mode, edge, event, ref, frame)),
      onMove: (event) => grid?.pointerMove(event),
      onEnd: (event) => grid?.pointerEnd(event),
    };
  }

  const EDGES = /** @type {const} */ (["inline", "block", "corner"]);
</script>

<div
  bind:this={ref}
  role="group"
  aria-labelledby={titleText ? titleId : undefined}
  {...$$restProps}
  class:bx--dashboard-grid__item={true}
  class:bx--dashboard-grid__item--placeholder={placeholder}
  class:bx--dashboard-grid__item--static={info?.locked}
  data-dashboard-grid-item={id}
  {style}
>
  <Card
    bind:ref={frame}
    class="bx--dashboard-grid__frame"
    data-lifted={lifted ? "" : undefined}
  >
    <div class:bx--dashboard-grid__header={true}>
      {#if movable}
        <button
          bind:this={handle}
          type="button"
          class:bx--dashboard-grid__handle={true}
          aria-label={$texts.handleLabelText({ label })}
          aria-describedby={$texts.instructionsId}
          on:keydown={(event) => grid?.keydown(id, label, event)}
          on:blur={() => grid?.blur(id)}
          use:pointerDrag={dragOptions("move", null, $options)}
        >
          <Draggable size={16} />
        </button>
      {/if}
      <div class:bx--dashboard-grid__title={true} id={titleId}>
        <slot name="header">
          {#if titleText}
            <Heading type="heading-compact-01">{titleText}</Heading>
          {/if}
        </slot>
      </div>
      {#if $$slots.actions}
        <div class:bx--dashboard-grid__actions={true}>
          <slot name="actions" />
        </div>
      {/if}
    </div>
    <Layer
      class="bx--dashboard-grid__body{noPadding
        ? ' bx--dashboard-grid__body--no-padding'
        : ''}"
      role={scrollable ? "region" : undefined}
      aria-label={scrollable ? label : undefined}
      tabindex={scrollable ? 0 : undefined}><slot /></Layer
    >
    {#if sizable}
      {#each EDGES as edge (edge)}
        <div
          class:bx--dashboard-grid__resize={true}
          class:bx--dashboard-grid__resize--inline={edge === "inline"}
          class:bx--dashboard-grid__resize--block={edge === "block"}
          class:bx--dashboard-grid__resize--corner={edge === "corner"}
          aria-hidden="true"
          use:pointerDrag={dragOptions("resize", edge, $options)}
        ></div>
      {/each}
    {/if}
  </Card>
</div>
