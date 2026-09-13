<script>
  let onCalendarReposition = null;

  function handleFocusOut(event) {} // flag

  const onKeydownRef = registerHandler(); // flag

  function handleKeydown(event) {}
</script>

<div on:keydown={handleKeydown} on:focusout={handleFocusOut}>
  content
</div>
