<script>
  import { link } from 'svelte-spa-router';
  import { Icon } from 'carbon-components-svelte';
  import AppSwitcher20 from 'carbon-icons-svelte/lib/AppSwitcher20';
  import Menu20 from 'carbon-icons-svelte/lib/Menu20';
  import Close20 from 'carbon-icons-svelte/lib/Close20';
  import ThemePicker from '../components/ThemePicker.svelte';
  import { sideNavToggled, appSwitcherToggled } from '../store';
</script>

<style>
  header {
    position: fixed;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    top: 0;
    left: 0;
    width: 100%;
    height: 2.5rem;
    padding: 0 1rem;
    background-color: var(--cds-ui-01);
    border-bottom: 1px solid var(--cds-ui-03);
  }

  .app-switcher {
    position: fixed;
    z-index: 9999;
    top: 2.5rem;
    right: 0;
    width: 16rem;
    height: calc(100% - 2.5rem);
    padding: 1rem;
    background-color: var(--cds-ui-01);
    transform: translateX(100%);
  }

  @media screen and (max-width: 768px) {
    .app-switcher {
      will-change: transform;
    }

    .app-switcher.toggled {
      transform: translateX(0);
      transition: transform 110ms cubic-bezier(0.2, 0, 1, 0.9);
      will-change: auto;
    }
  }

  .menu {
    display: none;
    align-items: center;
    justify-content: center;
    height: 2.5rem;
    width: 2.5rem;
    margin-left: -1rem;
    margin-right: 0.5rem;
    background: none;
    border: 0;
    fill: var(--cds-ui-05);
    cursor: pointer;
  }

  .menu--right {
    margin-left: auto;
    margin-right: -1rem;
  }

  .menu:focus {
    outline: 2px solid var(--cds-focus, #0f62fe);
    outline-offset: -2px;
  }

  nav {
    display: flex;
    align-items: center;
  }

  .bx--link {
    font-size: 1rem;
    color: var(--cds-text-01);
    white-space: nowrap;
  }

  .bx--link:hover {
    color: var(--cds-text-01);
    text-decoration: none;
  }

  @media screen and (max-width: 768px) {
    .menu {
      display: flex;
    }

    .theme {
      display: none;
    }
  }
</style>

<header>
  <nav>
    <button
      class="menu"
      on:click={() => {
        sideNavToggled.set(!$sideNavToggled);
        appSwitcherToggled.set(false);
      }}>
      <Icon render={$sideNavToggled ? Close20 : Menu20} />
    </button>
    <a
      class="bx--link"
      href="/"
      use:link
      on:click={() => {
        if ($sideNavToggled || $appSwitcherToggled) {
          sideNavToggled.set(false);
          appSwitcherToggled.set(false);
        }
        window.scrollTo(0, 0);
      }}>
      Carbon Components
      <strong>Svelte</strong>
    </a>
  </nav>
  <div class="theme">
    <ThemePicker inline />
  </div>
  <button
    class="menu menu--right"
    on:click={() => {
      appSwitcherToggled.set(!$appSwitcherToggled);
      sideNavToggled.set(false);
    }}>
    <Icon render={$appSwitcherToggled ? Close20 : AppSwitcher20} />
  </button>
</header>

<div class="app-switcher" class:toggled={$appSwitcherToggled}>
  <ThemePicker />
</div>
