<svelte:options immutable />

<script>
  /**
   * @template T
   */

  /**
   * The message type is written inline: a typedef cannot carry the generic
   * into the generated declarations.
   * @event {{ step: number; from: string; to: string; label: string; kind: string; datum: T } | null} hover Fires when the pointer or keyboard focus moves to another message, and with `null` when it leaves.
   * @event {{ message: { step: number; from: string; to: string; label: string; kind: string; datum: T }; originalEvent: Event }} select Fires when the focused message is activated by click, Enter, or Space.
   */

  /** @restProps {figure} */

  /**
   * Specify the messages, one row each.
   * @type {ReadonlyArray<T>}
   */
  export let data = [];

  /**
   * Specify how to read a message's sender: a key or a function.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let from;

  /**
   * Specify how to read a message's receiver.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let to;

  /**
   * Specify how to read a message's label.
   * @type {import("../utils/accessor.js").Accessor<T, string | number>}
   */
  export let label = undefined;

  /**
   * Specify how to read a message's kind. `"return"` is drawn dashed.
   * @type {import("../utils/accessor.js").Accessor<T, string>}
   */
  export let kind = undefined;

  /**
   * Specify how to read a message's place in the sequence, a number to
   * sort by. Defaults to input order.
   * @type {import("../utils/accessor.js").Accessor<T, number>}
   */
  export let order = undefined;

  /**
   * Specify the actors, left to right. Actors not named are added as
   * first seen.
   * @type {ReadonlyArray<string | number>}
   */
  export let actors = undefined;

  /** Specify the title, shown as the caption and used as the accessible name */
  export let title = "";

  /** Specify the width of an actor box, in pixels */
  export let actorWidth = 112;

  /** Specify the space between actors, in pixels */
  export let actorGap = 72;

  /** Specify the height of a message row, in pixels */
  export let rowHeight = 40;

  /**
   * Override the words used for assistive technology.
   * @type {{ message?: string; from?: string; to?: string; returns?: string; self?: string }}
   */
  export let words = {};

  /**
   * Obtain a reference to the HTML element.
   * @bindable readonly
   * @type {null | HTMLElement}
   */
  export let ref = null;

  import { createEventDispatcher } from "svelte";
  import { toAccessor } from "../utils/accessor.js";
  import { nextId } from "../utils/next-id.js";
  import { buildSequence } from "./sequence-geometry.js";

  const dispatch = createEventDispatcher();
  const ACTOR_HEIGHT = 36;
  const PAD = 8;
  const markerId = nextId("bx-viz-sequence");

  let active = -1;

  $: fromOf = toAccessor(from);
  $: toOf = toAccessor(to);
  $: labelOf = label === undefined ? undefined : toAccessor(label);
  $: kindOf = kind === undefined ? undefined : toAccessor(kind);
  $: orderOf = order === undefined ? undefined : toAccessor(order);
  // Depends on the data and the shape only, so hover never lays out again.
  $: sequence = buildSequence(data, {
    from: fromOf,
    to: toOf,
    label: labelOf,
    kind: kindOf,
    order: orderOf,
    actors,
    actorWidth,
    actorGap,
    rowHeight,
    top: ACTOR_HEIGHT,
  });
  $: width = sequence.width + PAD * 2;
  $: height = sequence.height + PAD;
  $: text = {
    message: "Message",
    from: "from",
    to: "to",
    returns: "returns",
    self: "to itself",
    ...words,
  };
  $: current = active >= 0 ? sequence.messages[active] : undefined;
  $: describe = (
    /** @type {import("./sequence-geometry.js").SequenceMessage<T>} */ message,
  ) =>
    [
      `${message.step + 1}.`,
      message.label,
      message.self
        ? `${message.from} ${text.self}`
        : `${text.from} ${message.from} ${text.to} ${message.to}`,
      message.kind === "return" ? text.returns : "",
    ]
      .filter(Boolean)
      .join(", ");
  $: announcement = current ? describe(current) : "";

  /** @param {import("./sequence-geometry.js").SequenceMessage<T>} message */
  function detail(message) {
    return {
      step: message.step,
      from: message.from,
      to: message.to,
      label: message.label,
      kind: message.kind,
      datum: message.datum,
    };
  }

  /** @param {number} index */
  function setActive(index) {
    if (index === active) return;
    active = index;
    dispatch("hover", index >= 0 ? detail(sequence.messages[index]) : null);
  }

  /** @param {Event} originalEvent */
  function selectActive(originalEvent) {
    if (current)
      dispatch("select", { message: detail(current), originalEvent });
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    const last = sequence.messages.length - 1;
    if (last < 0) return;
    let next = active;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        next = Math.min(last, active + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        next = Math.max(0, active - 1);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        selectActive(event);
        return;
      case "Escape":
        setActive(-1);
        return;
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
  }
</script>

<figure
  bind:this={ref}
  class:bx--viz-sequence={true}
  class:bx--viz-sequence--emphasis={active >= 0}
  {...$$restProps}
>
  {#if title}
    <figcaption class:bx--viz-chart__title={true}>{title}</figcaption>
  {/if}
  <!-- A chart is one tab stop. Arrow keys move message by message. -->
  <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <svg
    class:bx--viz-sequence__svg={true}
    viewBox="0 0 {width} {height}"
    style:max-width="{width}px"
    role="application"
    aria-roledescription="chart"
    aria-label={title || undefined}
    tabindex="0"
    on:keydown={onKeydown}
    on:click={selectActive}
    on:pointerleave={() => setActive(-1)}
    on:blur={() => setActive(-1)}
  >
    <defs>
      <marker
        id={markerId}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="8"
        markerHeight="8"
        orient="auto"
      >
        <path class:bx--viz-sequence__arrow={true} d="M0,0L10,5L0,10Z" />
      </marker>
    </defs>
    <g aria-hidden="true" transform="translate({PAD} 0)">
      {#each sequence.actors as actor (actor.name)}
        <line
          class:bx--viz-sequence__lifeline={true}
          x1={actor.x}
          x2={actor.x}
          y1={ACTOR_HEIGHT}
          y2={sequence.height}
        />
        <rect
          class:bx--viz-sequence__actor={true}
          x={actor.x - actorWidth / 2}
          y="0"
          width={actorWidth}
          height={ACTOR_HEIGHT}
        />
        <text
          class:bx--viz-sequence__actor-label={true}
          x={actor.x}
          y={ACTOR_HEIGHT / 2}
          dy="0.32em"
          text-anchor="middle"
        >
          {actor.name}
        </text>
      {/each}
      {#each sequence.messages as message, i (message.id)}
        <!-- svelte-ignore a11y-mouse-events-have-key-events -->
        <g
          class:bx--viz-sequence__message={true}
          class:bx--viz-sequence__message--return={message.kind === "return"}
          class:bx--viz-sequence__message--active={i === active}
          on:mouseenter={() => setActive(i)}
        >
          <!-- A wide, invisible strip: the line alone is too thin to hit. -->
          <rect
            class:bx--viz-sequence__hit={true}
            x={Math.min(message.x1, message.x2) - 4}
            y={message.y - rowHeight / 2}
            width={Math.abs(message.x2 - message.x1) + (message.self ? actorGap : 8)}
            height={rowHeight}
          />
          <path
            class:bx--viz-sequence__line={true}
            d={message.d}
            marker-end="url(#{markerId})"
          />
          {#if message.label}
            <text
              class:bx--viz-sequence__label={true}
              x={message.labelX}
              y={message.self ? message.y : message.y - 6}
              dy={message.self ? "0.32em" : undefined}
              text-anchor={message.labelAnchor}
            >
              {message.label}
            </text>
          {/if}
        </g>
      {/each}
    </g>
  </svg>
  <!-- Every message in order, for assistive technology. -->
  <ol class:bx--visually-hidden={true}>
    {#each sequence.messages as message (message.id)}
      <li>{text.message} {describe(message)}</li>
    {/each}
  </ol>
  <div class:bx--visually-hidden={true} aria-live="polite">{announcement}</div>
</figure>
