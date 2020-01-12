<script>
  import LogoGithub32 from 'carbon-icons-svelte/lib/LogoGithub32';
  import Logo from '../assets/logo.png';
  import ButtonTile from './ButtonTile.svelte';

  $: {
    document.title = `Carbon Components Svelte`;
  }
</script>

<style>
  main {
    margin-top: 5rem;
    padding-left: 12rem;
    padding-bottom: 2.5rem;
  }

  @media screen and (max-width: 768px) {
    main {
      padding-left: 0;
    }
  }

  .bx--grid {
    max-width: 66rem;
  }

  .logo {
    max-width: 4rem;
    margin-bottom: 0.5rem;
  }

  h1 {
    margin-bottom: 2rem;
    font-size: 2rem;
    line-height: 1.2;
  }

  h1 span {
    display: block;
  }

  h3 {
    margin-top: 4rem;
    margin-bottom: 1.5rem;
    font-size: 1.5rem;
  }
</style>

<main>
  <div class="bx--grid">
    <div class="bx--row">
      <div class="bx--col">
        <img src={Logo} alt="Logo" class="logo" />
        <h1>
          <span>
            <strong>Carbon</strong>
          </span>
          <span>
            <strong>Components</strong>
          </span>
          <span>
            <strong>Svelte</strong>
          </span>
        </h1>
        <p>The Carbon Design System implemented in Svelte</p>
      </div>
    </div>
    <div class="bx--row">
      <div class="bx--col">
        <h3>Packages</h3>
      </div>
    </div>
    <div class="bx--row bx--no-gutter">
      <div class="bx--no-gutter-sm bx--col-md-4 bx--col-lg-4">
        <ButtonTile iconLeft={LogoGithub32} href="https://github.com/IBM/carbon-components-svelte">
          Carbon Components Svelte
        </ButtonTile>
      </div>
      <div class="bx--no-gutter-sm bx--col-md-4 bx--col-lg-4">
        <ButtonTile iconLeft={LogoGithub32} href="https://github.com/IBM/carbon-icons-svelte">
          Carbon Icons Svelte
        </ButtonTile>
      </div>
    </div>
    <div class="bx--row">
      <div class="bx--col">
        <h3>Components</h3>
      </div>
    </div>
  </div>
</main>
