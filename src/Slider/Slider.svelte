<script>
  export let disabled = false;
  export let hideTextInput = false;

  /**
   * Set an id for the slider div element
   * @type {string} [id]
   */
  export let id = "ccs-" + Math.random().toString(36);
  export let inputType = "number";

  /**
   * Set to `true` to indicate an invalid state
   * @type {boolean} [invalid=false]
   */
  export let invalid = false;

  /**
   * Specify the label text
   * @type {string} [labelText=""]
   */
  export let labelText = "";

  /**
   * Set to `true` to enable the light variant
   * @type {boolean} [light=false]
   */
  export let light = false;

  export let max = 100;
  export let maxLabel = "";
  export let min = 0;
  export let minLabel = "";

  /**
   * Set a name for the slider element
   * @type {string} [name=""]
   */
  export let name = "";
  export let required = false;
  export let step = 1;
  export let stepMultiplier = 4;
  export let value = "";

  /**
   * Obtain a reference to the HTML element
   * @type {null | HTMLElement} [ref=null]
   */
  export let ref = null;

  import { createEventDispatcher, afterUpdate } from "svelte";

  const dispatch = createEventDispatcher();

  let trackRef = null;
  let dragging = false;
  let holding = false;

  function startDragging() {
    dragging = true;
  }

  function startHolding() {
    holding = true;
  }

  function stopHolding() {
    holding = false;
  }

  function calcValue(e) {
    const offsetX = e.touches ? e.touches[0].clientX : e.clientX;
    const { left, width } = trackRef.getBoundingClientRect();
    let nextValue =
      min +
      Math.round(((max - min) * ((offsetX - left) / width)) / step) * step;

    if (nextValue <= min) {
      nextValue = min;
    } else if (nextValue >= max) {
      nextValue = max;
    }

    value = nextValue;
  }

  afterUpdate(() => {
    if (!holding) {
      dispatch("change", value);
    }
  });

  $: range = max - min;
  $: left = ((value - min) / range) * 100;
  $: {
    if (value <= min) {
      value = min;
    } else if (value >= max) {
      value = max;
    }

    if (dragging) {
      calcValue(event);
      dragging = false;
    }
  }
</script>

<div
  class:bx--form-item={true}
  {...$$restProps}
  on:click
  on:mouseover
  on:mouseenter
  on:mouseleave>
  <label for={id} class:bx--label={true} class:bx--label--disabled={disabled}>
    {labelText}
  </label>
  <div class:bx--slider-container={true}>
    <span class:bx--slider__range-label={true}>{minLabel || min}</span>
    <div
      bind:this={ref}
      role="presentation"
      tabindex="-1"
      class:bx--slider={true}
      class:bx--slider--disabled={disabled}
      on:click={startDragging}
      on:mousemove={() => {
        if (holding) {
          startDragging();
        }
      }}
      on:touchmove={() => {
        if (holding) {
          startDragging();
        }
      }}
      on:mouseup={stopHolding}
      on:touchup={stopHolding}
      on:touchend={stopHolding}
      on:touchcancel={stopHolding}>
      <div
        role="slider"
        tabindex="0"
        class:bx--slider__thumb={true}
        style="left: {left}%"
        aria-valuemax={max}
        aria-valuemin={min}
        aria-valuenow={value}
        on:mousedown={startHolding}
        on:touchstart={startHolding}
        on:keydown={({ shiftKey, key }) => {
          const keys = { ArrowDown: -1, ArrowLeft: -1, ArrowRight: 1, ArrowUp: 1 };
          if (keys[key]) {
            value += step * (shiftKey ? range / step / stepMultiplier : 1) * keys[key];
          }
        }}
        {id} />
      <div bind:this={trackRef} class:bx--slider__track={true} />
      <div
        class:bx--slider__filled-track={true}
        style="transform: translate(0, -50%) scaleX({left / 100})" />
      <input
        type="hidden"
        class:bx--slider__input={true}
        {name}
        {value}
        {required}
        {min}
        {max}
        {step} />
    </div>
    <span class:bx--slider__range-label={true}>{maxLabel || max}</span>
    {#if !hideTextInput}
      <input
        type={inputType}
        id="input-{id}"
        aria-label={$$props['aria-label'] || 'Slider number input'}
        class:bx--text-input={true}
        class:bx--slider-text-input={true}
        class:bx--text-input--light={light}
        class:bx--text-input--invalid={invalid}
        on:change={({ target }) => {
          value = Number(target.value);
        }}
        {disabled}
        {value} />
    {/if}
  </div>
</div>
