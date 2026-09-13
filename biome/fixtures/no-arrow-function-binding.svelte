<script>
  export let value = 0;
  export let itemToString = (item) => item.text ?? item.id;
  export let itemText = (min, max) =>
    `${min}-${max}`;

  const noop = () => {}; // flag

  $: doubled = (() => { // flag
    return value * 2;
  })();

  $: mapper = (v) => v + 1; // flag

  $: label = `Value: ${value}`;

  let internalCallback = (x) => x + 1; // flag

  function handleClick() {}
</script>

<button on:click={() => handleClick()}>{label}</button>
