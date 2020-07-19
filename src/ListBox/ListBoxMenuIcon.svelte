<script>
  export const translationIds = { close: "close", open: "open" };
  export let open = false;
  export let translateWithId = id => defaultTranslations[id];

  import ChevronDown16 from "carbon-icons-svelte/lib/ChevronDown16";

  const defaultTranslations = {
    [translationIds.close]: "Close menu",
    [translationIds.open]: "Open menu"
  };

  $: description = open ? translateWithId("close") : translateWithId("open");
</script>

<div
  class:bx--list-box__menu-icon={true}
  class:bx--list-box__menu-icon--open={open}
  {...$$restProps}
  on:click|preventDefault|stopPropagation>
  <ChevronDown16 aria-label={description} title={description} />
</div>
