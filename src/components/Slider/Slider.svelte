<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let hideTextInput = false;
  export let id = Math.random();
  export let inputType = 'number';
  export let invalid = false;
  export let labelText = '';
  export let light = false;
  export let max = 100;
  export let maxLabel = '';
  export let min = 0;
  export let minLabel = '';
  export let name = '';
  export let required = false;
  export let step = 1;
  export let stepMultiplier = 4;
  export let style = undefined;
  export let value = '';

  import { createEventDispatcher, afterUpdate } from 'svelte';
  import { cx } from '../../lib';

  const dispatch = createEventDispatcher();

  let dragging = false;
  let holding = false;
  let elementRef = undefined;
  let trackRef = undefined;

  function startDragging() {
    dragging = true;
  }

  function startHolding() {
    holding = true;
  }

  function stopHolding() {
    holding = false;
  }

  function calcValue(event) {
    const offsetX = event.touches ? event.touches[0].clientX : event.clientX;
    const { left, width } = trackRef.getBoundingClientRect();
    let nextValue = min + Math.round(((max - min) * ((offsetX - left) / width)) / step) * step;

    if (nextValue <= min) {
      nextValue = min;
    } else if (nextValue >= max) {
      nextValue = max;
    }

    value = nextValue;
  }

  afterUpdate(() => {
    if (!holding) {
      dispatch('change', value);
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

<div on:click on:mouseover on:mouseenter on:mouseleave class={cx('--form-item', className)} {style}>
  <label for={id} class={cx('--label', disabled && '--label--disabled')}>{labelText}</label>
  <div class={cx('--slider-container')}>
    <span class={cx('--slider__range-label')}>{minLabel || min}</span>
    <div
      bind:this={elementRef}
      role="presentation"
      tabindex="-1"
      class={cx('--slider', disabled && '--slider--disabled')}
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
        class={cx('--slider__thumb')}
        style={`left: ${left}%`}
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
      <div bind:this={trackRef} class={cx('--slider__track')} />
      <div
        class={cx('--slider__filled-track')}
        style={`transform: translate(0, -50%) scaleX(${left / 100})`} />
      <input
        type="hidden"
        class={cx('--slider__input')}
        {name}
        {value}
        {required}
        {min}
        {max}
        {step} />
    </div>
    <span class={cx('--slider__range-label')}>{maxLabel || max}</span>
    {#if !hideTextInput}
      <input
        type={inputType}
        id={`input-${id}`}
        aria-label={$$props['aria-label'] || 'Slider number input'}
        class={cx('--text-input', '--slider-text-input', light && '--text-input--light', invalid && '--text-input--invalid')}
        on:change={({ target }) => {
          value = Number(target.value);
        }}
        {disabled}
        {value} />
    {/if}
  </div>
</div>
