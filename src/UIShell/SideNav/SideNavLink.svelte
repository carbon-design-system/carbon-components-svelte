<script>
  export let isSelected = false;
  export let href = undefined;
  export let text = undefined;
  export let icon = undefined;

  import { Icon } from "../../Icon";
</script>

<li class:bx--side-nav__item={true}>
  <a
    aria-current={isSelected ? 'page' : ''}
    {href}
    class:bx--side-nav__link={true}
    class:bx--side-nav__link--current={isSelected}
    {...$$restProps}
    on:click>
    <div class:bx--side-nav__icon={true} class:bx--side-nav__icon--small={true}>
      {#if icon}
        <Icon {...icon} />
      {/if}
    </div>
    <span class:bx--side-nav__link-text={true}>{text}</span>
  </a>
</li>
