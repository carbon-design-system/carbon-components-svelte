<script>
  /**
   * Specify the href attribute
   * @type {string}
   */
  export let title = undefined;

  /**
   * Specify the subtitle attribute
   * @type {string}
   */
  export let subtitle = undefined;

  /**
   * Specify the imgSrc attribute
   * @type {string}
   */
  export let imgSrc = undefined;

  /**
   * Set the imgSize of the head
   * @type {"small" | "normal" | "large"}
   */
  export let imgSize = "normal";

  /**
   * Set the titleSize of the head
   * @type {"small" | "normal" | "large"}
   */
  export let titleSize = "normal";

  let imgSizeValue;
  let titleSizeValue;

  switch (imgSize) {
    case "small":
      imgSizeValue = "0.75";
      break;
    case "normal":
      imgSizeValue = "1";
      break;
    case "large":
      imgSizeValue = "1.5";
      break;
  }

  switch (titleSize) {
    case "small":
      titleSizeValue = "1rem";
      break;
    case "normal":
      titleSizeValue = "1.5rem";
      break;
    case "large":
      titleSizeValue = "2rem";
      break;
  }
</script>

<style lang="scss">
  @import "@carbon/type/scss/styles";

  #header-identity {
    display: flex;
    width: 100%;
  }

  #header-identity-img {
    width: calc(20% * var(--img-size-multiply));
    min-width: calc(70px * var(--img-size-multiply));
    max-width: calc(100px * var(--img-size-multiply));

    background-size: cover;
    background-image: var(--img-src), url("https://via.placeholder.com/200x200");
    margin-right: 15px;
  }

  #header-texts {
    margin: auto 0;
  }

  h1 {
    @include carbon--type-style("expressive-heading-06");
    font-size: var(--title-size);
    font-weight: bold;
    letter-spacing: -0.09rem;
    margin-right: 50px;
  }

  span#subtitle {
    @include carbon--type-style("expressive-heading-02");
    font-weight: 400;
    display: block;
  }

  #header-tabs {
    min-width: 330px;
  }
</style>

<div id="header-identity">
  {#if imgSrc}
    <div
      id="header-identity-img"
      class="bx--aspect-ratio bx--aspect-ratio--1x1"
      style="{`--img-size-multiply: ${imgSizeValue}; --img-src: url('${imgSrc}')`}"
    ></div>
  {/if}
  {#if title || subtitle}
    <div id="header-texts">
      {#if title}
        <h1 style="{`--title-size: ${titleSizeValue}`}">{title}</h1>
      {/if}
      {#if subtitle}<span id="subtitle">{subtitle}</span>{/if}
      <slot />
    </div>
  {/if}
  {#if $$slots.tabs}
    <div id="header-tabs">
      <slot name="tabs" />
    </div>
  {/if}
</div>
