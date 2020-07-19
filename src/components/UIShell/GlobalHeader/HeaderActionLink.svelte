<script>
  export let href = undefined;
  export let type = undefined;
  export let icon = undefined;
  export let linkIsActive = undefined;

  import { Icon } from "../../Icon";
</script>

<style>
  .action-link {
    text-align: center;
    align-items: center;
    vertical-align: middle;
    justify-content: center;
    padding-top: 10px;
  }
</style>

<a
  aria-label={type}
  class:bx--header__action={true}
  class:bx--header__action--active={linkIsActive}
  class:action-link={true}
  {href}>
  <Icon {...icon} />
</a>
