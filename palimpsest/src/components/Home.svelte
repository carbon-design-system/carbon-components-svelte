<script>
  import Logo from '../assets/logo.png';
</script>

<style>
  main {
    margin-top: 5.5rem;
    padding-left: 12rem;
    padding-bottom: 2.5rem;
  }

  .bx--grid {
    max-width: 66rem;
  }

  .logo {
    max-width: 4.5rem;
    margin-bottom: 0.5rem;
  }

  h1 {
    margin-bottom: 2rem;
  }

  h1 span {
    display: block;
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
        <h3>The Carbon Design System implemented in Svelte</h3>
      </div>
    </div>
    <div class="bx--row">
      <div class="bx--col">1</div>
    </div>
  </div>
</main>
