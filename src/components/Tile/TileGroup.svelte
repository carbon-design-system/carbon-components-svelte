<script>
  let className = undefined;
  export { className as class };
  export let disabled = false;
  export let legend = '';

  import { cx } from '../../lib';

  $: _class = cx('--tile-group', className);
</script>

<fieldset class={_class} {disabled}>
  {#if legend}
    <legend>{legend}</legend>
  {/if}
  <div>
    <slot />
  </div>
</fieldset>
