# Changelog

All notable changes to this project will be documented in this file. This project follows [Conventional Commits](https://www.conventionalcommits.org/); run `bun scripts/release-changelog` to bump the version and prepend release notes.

### [0.110.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.109.0...v0.110.0) (2026-07-10)

### ⚠ BREAKING CHANGES

- **code-snippet:** CodeSnippet now renders the "Copied!" feedback in a
body-level portal by default instead of the inline `.bx--copy-btn__feedback`
caret. Pass `portalTooltip={false}` to restore the previous inline markup. ([51f3d6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/51f3d6a8d99e0585d1cf3802338c977c293c4100))
- **copy-button:** CopyButton/CopyInput now render the "Copied!" feedback in
a body-level portal by default instead of the inline `.bx--copy-btn__feedback`
caret. Pass `portalTooltip={false}` to restore the previous inline markup. ([27e2ef9](https://github.com/carbon-design-system/carbon-components-svelte/commit/27e2ef922ce99898e4e6259bcb09350f680914db))
- **floating-portal:** change `lockDirection` to enum ([787404b](https://github.com/carbon-design-system/carbon-components-svelte/commit/787404bd5c7c93ded41a01060eb0c20566074db5))
- **structured-list:** selection rows now render the icon column automatically;
remove any manually placed checkmark cell to avoid a duplicate. ([9785256](https://github.com/carbon-design-system/carbon-components-svelte/commit/9785256010e7ffc55903f33154fb3c50435d5df6))
- **tabs:** replace mobile dropdown with scrollable overflow tabs ([17c6c59](https://github.com/carbon-design-system/carbon-components-svelte/commit/17c6c59c4d79660039fca0ccec54d19e001eb54f)), closes [#3325](https://github.com/carbon-design-system/carbon-components-svelte/issues/3325)
- **ui-shell:** do not animate `HeaderAction` panel by default ([64a584f](https://github.com/carbon-design-system/carbon-components-svelte/commit/64a584f2977efe6fb17f3c7ae13ba576d450682b))

### Features

- **breakpoint:** add hideAtBreakpoint action ([3bbcff2](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bbcff2986147824ac9bc886c733fe7d63fb89cb))
- **button:** forward on:mousedown, skip tooltip when iconDescription is empty ([5d35cdc](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d35cdc2474c147ff5a5dfb18b11bb5f05690084))
- **code-snippet:** add mask gradient for single/multi-line variants (#3343) ([22ec08b](https://github.com/carbon-design-system/carbon-components-svelte/commit/22ec08babbb0bebd5f6a9df28934c336b35e537e))
- **code-snippet:** portal the feedback tooltip by default ([51f3d6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/51f3d6a8d99e0585d1cf3802338c977c293c4100))
- **code-snippet:** support tooltipPosition and tooltipAlignment ([35ccb7f](https://github.com/carbon-design-system/carbon-components-svelte/commit/35ccb7f031ee17c02eccb9fe3ecc5580ab950bd0))
- **combo-box:** accept inline typeahead suggestion in place on Right/End ([9492ff9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9492ff93c639fb4fe08b72b71b7c3e01bbf0666c))
- **combo-box:** accept typeahead suggestion on focus out ([67cf88c](https://github.com/carbon-design-system/carbon-components-svelte/commit/67cf88c5267374a8c9fb272f7e2c3fb331653310))
- **combo-box:** add xs size ([3bddd31](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bddd313860b47601e9aeb94e437544fb6b7314c))
- **combo-button:** add `ComboButton` component ([66334af](https://github.com/carbon-design-system/carbon-components-svelte/commit/66334af68050da9fd25894ad3a962a3209a7f301)), closes [#2488](https://github.com/carbon-design-system/carbon-components-svelte/issues/2488)
- **copy-button:** add ghost kind, sizes, and a hover tooltip ([b3c30a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/b3c30a85c6663e8153a71ae4794fef6a0d8d99d5))
- **copy-button:** portal the feedback tooltip by default ([27e2ef9](https://github.com/carbon-design-system/carbon-components-svelte/commit/27e2ef922ce99898e4e6259bcb09350f680914db))
- **copy-input:** add tooltip position and alignment ([f057186](https://github.com/carbon-design-system/carbon-components-svelte/commit/f057186285d28f5a75bfe11e67dfe4ae54eb0646))
- **date-picker:** add "month" type ([9f833b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/9f833b2b86ec21fa8814af2b3200235b6d44e699)), closes [#976](https://github.com/carbon-design-system/carbon-components-svelte/issues/976)
- **dialog:** add `Dialog` component ([56cba4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/56cba4d4bb445b9ce9224c4fccdab029e91ef510))
- **disclosure:** add `Disclosure` component ([f8ebc2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8ebc2a9e8fb4233e7191f4879017e7bd2da7be4))
- **dropdown:** add xs size ([7841161](https://github.com/carbon-design-system/carbon-components-svelte/commit/78411618b9b7ff27ae0cfa32723139bb090373c4))
- **header-search:** support closeButtonLabelText prop ([98582a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/98582a89d1f49cb0b48b2ee1d88742263b2189a6))
- **header-search:** support icon prop override ([31eaee4](https://github.com/carbon-design-system/carbon-components-svelte/commit/31eaee44ff9c69201b41d8e491b5629d2fd5b377))
- **header-search:** support labelText prop ([c69776c](https://github.com/carbon-design-system/carbon-components-svelte/commit/c69776cd26824e30541475f9679e48c1c593d9fc))
- **header-search:** support placeholder prop ([745e7df](https://github.com/carbon-design-system/carbon-components-svelte/commit/745e7df67bce24e202ec89abad765af4a5bc45fd))
- **icon-indicator:** add `IconIndicator` component ([514a18f](https://github.com/carbon-design-system/carbon-components-svelte/commit/514a18f3676bd3502f877c192a3bcead3c40cc71))
- **link:** add muted variant that inherits text color ([c540235](https://github.com/carbon-design-system/carbon-components-svelte/commit/c5402355d27a942b3aa7fca49bf8141858f955b0))
- **link:** make medium size explicit ("md") ([8332ba2](https://github.com/carbon-design-system/carbon-components-svelte/commit/8332ba20b83f15c02dcf9baabd5b50165b6e154c))
- **link:** scale icon and tighten gap to match link size ([6d53da4](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d53da4dcff96d7c94b2757c72f6f1c30a6418fe))
- **list-box:** add xs size ([9cd97eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/9cd97eb1709819ccfa35d2ee2ad458600757c403))
- **menu-button:** add MenuButton component ([a23150a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a23150a3593bc8f9ec927f06f91e3d9f115413be)), closes [#2489](https://github.com/carbon-design-system/carbon-components-svelte/issues/2489)
- **menu:** add `Menu` and `MenuItem` primitives ([d845af4](https://github.com/carbon-design-system/carbon-components-svelte/commit/d845af4d57b6570e69d4d44719f030f10bf2b20e))
- **multi-select:** add xs size ([a59624e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a59624ea4fb312f92d46e8b8f783755e34172e62))
- **search-menu:** add `SearchMenu` ([577bca5](https://github.com/carbon-design-system/carbon-components-svelte/commit/577bca5fa6d1f76712298baf1183eadbec0bcf73))
- **shape-indicator:** add `ShapeIndicator` component ([682b512](https://github.com/carbon-design-system/carbon-components-svelte/commit/682b51207725d33b1ebf36c9cd063adf16e4975a))
- **tabs-vertical:** add `TabsVertical` component ([02bbd96](https://github.com/carbon-design-system/carbon-components-svelte/commit/02bbd96f3ee7a99b27e068b350868b17c3bc8ec4)), closes [#2726](https://github.com/carbon-design-system/carbon-components-svelte/issues/2726)
- **tabs-vertical:** add `TabsVerticalSkeleton` ([c6a1082](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6a1082193c9edf0c209a54d2eb83f600fc0d22b))
- **tabs:** `TabsVertical` supports sm/md/lg sizes ([77edafd](https://github.com/carbon-design-system/carbon-components-svelte/commit/77edafdae1b38e48386ebf5c5a01b36b64b5550d))
- **tag-set:** add `TagSet` component ([c59fe9f](https://github.com/carbon-design-system/carbon-components-svelte/commit/c59fe9f62b206f217af6346ecb6e33724a3bdc1e))
- **toggletip:** add `Toggletip` ([146fa3e](https://github.com/carbon-design-system/carbon-components-svelte/commit/146fa3e6fe55489af339548a69478200afebcc29)), closes [#3371](https://github.com/carbon-design-system/carbon-components-svelte/issues/3371)
- **tree-view:** add `select:change` aggregate selection event ([cc4a813](https://github.com/carbon-design-system/carbon-components-svelte/commit/cc4a81307f16f36dfee3e61dbb5960c17451886b))
- **tree-view:** add `toggle:change` aggregate expansion event ([f5c665b](https://github.com/carbon-design-system/carbon-components-svelte/commit/f5c665bf0c7c38a7076d7d102e743ca1b569b917))
- **ui-shell:** `HeaderNavItem` supports icon ([5f0e93f](https://github.com/carbon-design-system/carbon-components-svelte/commit/5f0e93f1b0a0cde3ad45917da4941c4efaad818b))
- **ui-shell:** `HeaderSearch` supports `SearchMenu` composition ([c061221](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0612210ff427f0e78b48b16fcf74eadbda2413e))
- **ui-shell:** add `ProfileMenu` ([2552a6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/2552a6a1ae2b475346a3b1891b0db729dc28b670))
- **user-avatar-group:** add `UserAvatarGroup` ([b61c7c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/b61c7c7862ad3ee006ba661dc97bd5e72c2d03bf))
- **user-avatar:** add `UserAvatar` ([61c6de5](https://github.com/carbon-design-system/carbon-components-svelte/commit/61c6de541a4207a4e784a951d50f86c2e8a2bf6a))
- **user-avatar:** add auto background color ([95c0390](https://github.com/carbon-design-system/carbon-components-svelte/commit/95c03904b103ac1c3a7ef820f463e8d9a1bcd1c1))

### Bug Fixes

- **code-snippet:** multi-line variant dynamically shows expand button based on content height ([0f0dce8](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f0dce82dd38886ec5be05b7ec9d9a1c43c946c8))
- **combo-box:** decouple hover highlight from Enter selection ([c3ec9a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3ec9a0d4233a398fc0c88658b363229d90bca74))
- **combo-box:** only inline-complete typeahead on a prefix match ([7345732](https://github.com/carbon-design-system/carbon-components-svelte/commit/73457328abb7772670831bc944f975b4b2b91ddc))
- **combo-box:** preserve displayed selection across async items changes ([701382e](https://github.com/carbon-design-system/carbon-components-svelte/commit/701382eee7a6932652cad74df08e95e03d67c361))
- **combo-box:** set aria-autocomplete to "both" with typeahead ([0b99228](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b99228a2efa18ed29861c42d20e062a5e6e5d55))
- **dropdown:** decouple hover highlight from Enter selection ([47665df](https://github.com/carbon-design-system/carbon-components-svelte/commit/47665dfc74dccefcab8298d771e91f0b242a8b12))
- **dropdown:** prevent page scroll when opening menu with Space (#3346) ([00f87c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/00f87c7c848807bbeb142d115904154feb8b00d2))
- **floating-portal:** change `lockDirection` to enum ([787404b](https://github.com/carbon-design-system/carbon-components-svelte/commit/787404bd5c7c93ded41a01060eb0c20566074db5))
- **floating-portal:** keep a flipped tooltip side stable across content resize ([f108385](https://github.com/carbon-design-system/carbon-components-svelte/commit/f108385277c0b7fa979cdc67143cec93b53d69bb))
- **floating-portal:** keep the tooltip caret on the anchor when content resizes ([a11d65c](https://github.com/carbon-design-system/carbon-components-svelte/commit/a11d65ca2ce00466e7ff3b220d1468aee93fa98d))
- **list-box:** scope highlighted-item scroll to the menu, not the page ([1f91144](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f91144eb8da5ad6a9835b098dc559280fe72fd3))
- **multi-select:** decouple hover highlight from Enter selection ([01c14e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/01c14e80cf6c1c23a0e629c81808b81baac3549f))
- **multi-select:** make read-only reviewable, drop disabled semantics (#3359) ([f7a67f5](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7a67f5bc96435a25d60798debebbde0736b4804))
- **multi-select:** retain selectedIds when items list clears ([5d59f81](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d59f81daab91893087ba3f09a55800cbb3ca9e8))
- **select:** re-assert native value when an option unmounts (#3392) ([4a2c722](https://github.com/carbon-design-system/carbon-components-svelte/commit/4a2c72288d8a21e5fe489d042fc72d2ae7eb7097))
- **select:** re-assert native value when options mount async ([9e60780](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e60780fe89b51a8a13e0c041e5cb886418cfca2))
- **tooltip:** give the interactive tooltip dialog an accessible name ([647e7c7](https://github.com/carbon-design-system/carbon-components-svelte/commit/647e7c73825fd2d2412cb3b505f45ba194208fee))
- **tooltip:** keep mouse hover from stealing focus into TooltipFooter ([ee54b73](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee54b734fb0b24f5b0ed62173bc3e6e06a6b8252))
- **tree-view:** dispatch select/toggle/focus with correct state ([187c9d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/187c9d08f666614b5d09a2facdee4bfe0758d7db))
- **ui-shell:** do not animate `HeaderAction` panel by default ([64a584f](https://github.com/carbon-design-system/carbon-components-svelte/commit/64a584f2977efe6fb17f3c7ae13ba576d450682b))
- **utils:** defer dismiss() window listener registration past the enabling click ([f411e26](https://github.com/carbon-design-system/carbon-components-svelte/commit/f411e26b56d25ecdecb3d2fcd77ed9229fa9cb6c))

### Performance

- **data-table:** use Set for O(1) lookups for expanded rows (#3352) ([5be5d13](https://github.com/carbon-design-system/carbon-components-svelte/commit/5be5d13e98b8e5b2c0db8c7ba58707d87720e672))

### [0.109.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.108.0...v0.109.0) (2026-06-15)

### ⚠ BREAKING CHANGES

- **accordion-item:** rename `iconDescription` to `ariaLabel` for heading button ([72431ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/72431ea3d8e09ee1d1193d9fdc9866354daf724b))
- **css:** drop older browser support (match Svelte 5 baseline) for ~7% size decrease (#3235) ([3f9e29b](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f9e29bf051c582ededbb418bad050697ab8ed6d))

### Features

- **badge-indicator:** add `BadgeIndicator` ([f5959b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/f5959b600d6a6e6a8a444b5c7b2c820c50bcfb30))
- **box:** add Box component and utility container classes ([8e15cc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e15cc92b4bf47741dbfc02e38b3c0f6e328f75f))
- **button:** add `badge` slot to compose `BadgeIndicator` with icon-only button ([7df0a82](https://github.com/carbon-design-system/carbon-components-svelte/commit/7df0a82d46c3f2001764109aa59d9ae9c6ac536e))
- **button:** support `portalTooltip` ([df3454c](https://github.com/carbon-design-system/carbon-components-svelte/commit/df3454c2303043169e802e1db0553098e8d66166))
- **code-button:** add `ref` prop for button reference ([0ae19ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/0ae19ad1e15a42dc8bae0b9f2bb44df7fa029985))
- **code-snippet:** add `codeLabel` prop for container aria-label (#3188) ([b242f5b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b242f5b362d7e8f7b0a070b32be38cda34f5394c))
- **code-snippet:** add `copyRef` prop for copy button reference ([fbf202a](https://github.com/carbon-design-system/carbon-components-svelte/commit/fbf202a0c7497f0c49e9ab356e279f4611ef1106))
- **combo-box:** add `fluid` prop for fluid form support ([6b883af](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b883af8e1d5b77c85a232dc511218fb5a81d92b))
- **combo-box:** add `icon` and `iconRight` ([25493ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/25493ca1e9342403f7fd11ac6552035376b377b4))
- **combo-box:** add FluidComboBoxSkeleton component ([5d8bd6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d8bd6f123657b9143c2fb0a76e2963962a6b846))
- **combo-box:** dispatch `close` event with dismissal `trigger` (#3313) ([9c10f17](https://github.com/carbon-design-system/carbon-components-svelte/commit/9c10f1707da3468010dc6d4b5a390eff5a220637))
- **combo-box:** pass `selected` and `highlighted` to default slot ([8e5068f](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e5068f7f53f0ed2afbecae6138ef11d78f17341))
- **composed-modal:** add "programmatic" close trigger ([4a8cc29](https://github.com/carbon-design-system/carbon-components-svelte/commit/4a8cc290fae6152884c1d42488bb532c3895b5a7))
- **composed-modal:** add `fullWidth` prop ([b07213a](https://github.com/carbon-design-system/carbon-components-svelte/commit/b07213af1f5ee47ac0d267180fafb4a626c1f7b8))
- **content-switcher:** `Switch` supports icon-only variant ([91458e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/91458e83c9457a9bb0bb0aed9abe5e55cf4a8840)), closes [#2758](https://github.com/carbon-design-system/carbon-components-svelte/issues/2758)
- **content-switcher:** support icon-only, low contrast variant ([4bbe2e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/4bbe2e3de9c8ec10289f9f2712e5de39ed3a9196))
- **content-switcher:** support low contrast variant ([c0f3fec](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0f3fec599994693ed56f0736f21672f0c0e851b)), closes [#2759](https://github.com/carbon-design-system/carbon-components-svelte/issues/2759)
- **context-menu:** `close` event surfaces dismissal `trigger` (#3309) ([51e05bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/51e05bc626c87d50cb201d0e7878c3330b283de3))
- **copy-input:** add `CopyInput` ([3cda4e1](https://github.com/carbon-design-system/carbon-components-svelte/commit/3cda4e1d090bb86ec9bd02e67f59e3566091bde4))
- **copy-input:** add `fluid` prop for fluid form support ([1a3da64](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a3da6420e4aabbc302f87873d6850f6f1940f05))
- **copy-input:** add FluidCopyInputSkeleton component ([9288ab0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9288ab0b6f4b10631d81937c48b6c87215798281))
- **data-table:** add `highlightedRowIds` ([ec97d3b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec97d3bb744850d021323122c66a04c7d2b45b07))
- **data-table:** add `stickyHeaderMaxHeight` prop for sticky header ([cfd5447](https://github.com/carbon-design-system/carbon-components-svelte/commit/cfd54471e638b697316549f15b81fe415d56f1e9)), closes [#1697](https://github.com/carbon-design-system/carbon-components-svelte/issues/1697)
- **data-table:** add filterMode="hide" to preserve row state while filtering ([a81d64e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a81d64ec9fe73c73ebc6ec31aaa7ab1ee3b5fde0))
- **data-table:** add refreshRow/refreshCells to re-derive cells after in-place edits ([0b7e503](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b7e50376de8dabbead271a84f208f49694b734f))
- **data-table:** inherit `Toolbar` size from parent `DataTable` ([5edbc03](https://github.com/carbon-design-system/carbon-components-svelte/commit/5edbc03eb82c6346c75d1818e1a2382a97017863))
- **date-picker:** `close` event surfaces dismissal `trigger` ([e1a876b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1a876b28162b23bc9ebc1bee1c56c9b61dc8817))
- **date-picker:** add `fluid` prop for fluid form support ([e088bed](https://github.com/carbon-design-system/carbon-components-svelte/commit/e088bed0b5047ed9b534f59e9fe810992c1739e0))
- **date-picker:** add FluidDatePickerSkeleton component ([ac7eede](https://github.com/carbon-design-system/carbon-components-svelte/commit/ac7eede840b85fea0445cac2edacd974a140ee77))
- **dropdown:** add `fluid` prop for fluid form support ([d8c85eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8c85eb00015fbb18b0ddb7c5598d8bf236c3722))
- **dropdown:** add `icon` and `iconRight` ([8b32baf](https://github.com/carbon-design-system/carbon-components-svelte/commit/8b32bafebac23f67761a1cf0a7266b1ab8276171))
- **dropdown:** add FluidDropdownSkeleton component ([3d84cfd](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d84cfde4c604b829599fdd9f2680a8764912bc7))
- **dropdown:** dispatch `close` event with dismissal `trigger` (#3312) ([47798ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/47798ba9ebc7899b83c292485a5bac8a3a48223e))
- **dropdown:** pass `selected` and `highlighted` to default slot ([11bd316](https://github.com/carbon-design-system/carbon-components-svelte/commit/11bd316a2d8f4d51822246a19f44b176baecc4f7))
- **expandable-tile:** forward focus/blur events (#3174) ([a2f2cd0](https://github.com/carbon-design-system/carbon-components-svelte/commit/a2f2cd0a9c9dcce993a7d1612ddc6581e3828982))
- **file-uploader-drop-container:** dispatch `rejected` event (#3187) ([ec7a0eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec7a0ebc21d952287789b0df3f917662fb3566dd))
- **file-uploader-skeleton:** add `hideLabelTitle` and `hideLabelDescription` props ([9dc56d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/9dc56d3d7df2295a73cc177c765fd2c8d69f9948))
- **header-search:** pass `selected` to result slot ([41bcab1](https://github.com/carbon-design-system/carbon-components-svelte/commit/41bcab1f3cd738394f6a2a058b1c57450ccc0a76))
- **local-storage:** add `sync` prop to opt out of storage event sync ([303b193](https://github.com/carbon-design-system/carbon-components-svelte/commit/303b193ff9f74e853600afa71ac664d967272143))
- **modal:** add "programmatic" close trigger ([e85b563](https://github.com/carbon-design-system/carbon-components-svelte/commit/e85b5636989c20a8f41fc23b7f1ceda9a57a43c7))
- **modal:** add `fullWidth` prop ([16fce32](https://github.com/carbon-design-system/carbon-components-svelte/commit/16fce32aa7f23c036d636018293d7e5622da6c6a))
- **multi-select:** add `fluid` prop for fluid form support ([d84c56e](https://github.com/carbon-design-system/carbon-components-svelte/commit/d84c56eb24d2892c276cda69f60a204aba77d64e))
- **multi-select:** add FluidMultiSelectSkeleton component ([22eba4c](https://github.com/carbon-design-system/carbon-components-svelte/commit/22eba4c91582ba622960324fe772a1c650ac2e5a))
- **multi-select:** dispatch `close` event with dismissal `trigger` (#3314) ([789ee5f](https://github.com/carbon-design-system/carbon-components-svelte/commit/789ee5fbf7edace42ffcaa34bca1b0455ce278a2))
- **multi-select:** pass `selected` and `highlighted` to default slot ([6da1395](https://github.com/carbon-design-system/carbon-components-svelte/commit/6da139548ccd94df063dab22d12b84d7458e7e27))
- **number-input:** add `fluid` prop for fluid form support ([afff038](https://github.com/carbon-design-system/carbon-components-svelte/commit/afff038f451116c0750964021ccdb48377542f02))
- **number-input:** add FluidNumberInputSkeleton component ([0f3031b](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f3031ba2e4b82a7a95540e0e2ff66cf2d3f0bdc))
- **overflow-menu-item:** support `icon` and `iconRight` ([a3e794e](https://github.com/carbon-design-system/carbon-components-svelte/commit/a3e794e0261ab259875f6d9a02fe9e4772e79bff))
- **overflow-menu:** `close` event surfaces dismissal `trigger` (#3311) ([b5852d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/b5852d68449744131bbbdeefd7267505ddb122e6))
- **overflow-menu:** support `xs` size ([5c7f382](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c7f3821fe6e835865f6dfc1a5b28173f2da8884))
- **pagination-skeleton:** add `size` prop ([516f2bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/516f2bd0c17a6d18c98024681a2410fe6488beff))
- **pagination:** add `size` prop ([c7c7149](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7c71491a21b9988f342e5788f537f419a822942))
- **pagination:** add `xs` size ([2fd445f](https://github.com/carbon-design-system/carbon-components-svelte/commit/2fd445fa73ffcdfba8084ba3b572272926e44a35))
- **pagination:** add `xs` size ([a4084f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/a4084f0bca9c83ec40f61b395263620a886c77c7))
- **password-input:** add `PasswordInputSkeleton` ([b740a44](https://github.com/carbon-design-system/carbon-components-svelte/commit/b740a445248d8e9a44981690acec730b87487777))
- **password-input:** support `xs` size ([d70270b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d70270b69a87d57060e2871ba5ad83c9e079abfa))
- **pin-code-input:** add `fluid` prop for fluid form support ([280a451](https://github.com/carbon-design-system/carbon-components-svelte/commit/280a451140b4fc28752085bccafc156efb39a87b))
- **pin-code-input:** add `PinCodeInput` ([9480360](https://github.com/carbon-design-system/carbon-components-svelte/commit/948036061caa787f8b21d4fcecad729239c1f701))
- **pin-code-input:** add `PinCodeInputSkeleton` ([c6fc2eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/c6fc2eb84931d7eed6545e2e508aaa6235ed4e25))
- **pin-code-input:** add FluidPinCodeInputSkeleton component ([db3c199](https://github.com/carbon-design-system/carbon-components-svelte/commit/db3c199d7c52991a8bcfce0f708aec98af4795b0))
- **pin-code-input:** support `xs` size ([81272a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/81272a7684188afd5628815a6b52981a8c7316ee))
- **popover:** dispatch `close` when `closeOnOutsideClick` auto-closes (#3319) ([9103c6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/9103c6ff2e99e2dfa03f758414bb5a101e3bdb09))
- **search-skeleton:** add `hideLabel` prop ([e5f570a](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5f570a208ec696a1c6abc99b055cf70aecdd76b))
- **search:** add `fluid` prop for fluid form support ([c1427b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/c1427b472ff2a8c6d26ebaffc7cf149c66b65e19))
- **search:** add FluidSearchSkeleton component ([dfda530](https://github.com/carbon-design-system/carbon-components-svelte/commit/dfda530465837d0cecfc8f24bfff434014ee5a24))
- **search:** support `xs` size ([c2780cb](https://github.com/carbon-design-system/carbon-components-svelte/commit/c2780cbcf19ed1b1f84362fc0f6821e8fd732325))
- **select:** add `fluid` prop for fluid form support ([b29cabe](https://github.com/carbon-design-system/carbon-components-svelte/commit/b29cabe89badbfd6442a1b00ac0a31de432328ad)), closes [#502](https://github.com/carbon-design-system/carbon-components-svelte/issues/502)
- **select:** add FluidSelectSkeleton component ([03796f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/03796f6766f9cf88bde21fb387ac4a4ac6270f9a))
- **select:** support `xs` size ([15b6131](https://github.com/carbon-design-system/carbon-components-svelte/commit/15b6131d61b398f84fa201a5fdeb2d072029c60f))
- **session-storage:** add `sync` prop to opt out of storage event sync ([535a999](https://github.com/carbon-design-system/carbon-components-svelte/commit/535a999489d3d8bc0d227cf867f9edce26b095c5))
- **stack:** add `wrap` prop for flex-wrap support ([d00fce6](https://github.com/carbon-design-system/carbon-components-svelte/commit/d00fce6e3bf8da010158d9ce8a10bd9900b526e6))
- **structured-list:** support `multiple` selection ([13c1cd9](https://github.com/carbon-design-system/carbon-components-svelte/commit/13c1cd987e9929238abd78323acff9bce7180cce))
- **tabs:** pass `selected` to Tab default slot ([986ca51](https://github.com/carbon-design-system/carbon-components-svelte/commit/986ca51cd94f2fa2dd73a4ed554fa4f6f85efcfc))
- **tabs:** support dismissible tabs ([a7d7bd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7d7bd17479bb4ffbfaaedcf41e591692c17f88b)), closes [#2727](https://github.com/carbon-design-system/carbon-components-svelte/issues/2727)
- **tabs:** support icon-only variant ([1661cb9](https://github.com/carbon-design-system/carbon-components-svelte/commit/1661cb9193b4a913530316d087f573a723c0b0f5)), closes [#2728](https://github.com/carbon-design-system/carbon-components-svelte/issues/2728)
- **tag:** add `inline` prop ([a8995f4](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8995f4f2371611053cbb71e3d966a53432102fd))
- **text-area:** add `fluid` prop for fluid form support ([ee85a7a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee85a7a38f83474395addd70e53b50e846c8986a)), closes [#1598](https://github.com/carbon-design-system/carbon-components-svelte/issues/1598)
- **text-area:** add FluidTextAreaSkeleton component ([b23dfdd](https://github.com/carbon-design-system/carbon-components-svelte/commit/b23dfdd04dabfc66e8927e076c3933bf3e660dc3))
- **text-input:** add `fluid` prop for fluid form support ([ad01613](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad016134a23528ea4bb72fcca041f1eed6c616a5))
- **text-input:** add FluidTextInputSkeleton component ([e7bc62d](https://github.com/carbon-design-system/carbon-components-svelte/commit/e7bc62de6e53d614eb6b4809a7755865412857b0))
- **text-input:** support `xs` size ([9367e64](https://github.com/carbon-design-system/carbon-components-svelte/commit/9367e64befbce20253d6f018a988006d0a6ec628))
- **text:** add `Text` component and utility typography classes ([e58163d](https://github.com/carbon-design-system/carbon-components-svelte/commit/e58163deb9a12afefe53d20951558c062658e026))
- **time-picker:** add `fluid` prop for fluid form support ([e69c022](https://github.com/carbon-design-system/carbon-components-svelte/commit/e69c022538cda32d780a70e0b468acbdac05d162))
- **time-picker:** add FluidTimePickerSkeleton component ([aa3c1b0](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa3c1b0e7c9c1048e245e00f987cae38c6d55122))
- **toolbar:** add "xs" size ([b24f2f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/b24f2f2e8deca51fb2e51af84cd9ca768e095dcb))
- **truncation:** add `lines` prop for multi-line support ([9d89681](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d896812bf644e9abecfd6e6c3f15bc61106b6c7))
- **ui-shell:** `HeaderAction` close event surfaces dismissal `trigger` (#3310) ([ce4f3a4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ce4f3a4bf142b7f07ad426cd5fe048b694a7b324))
- **ui-shell:** `HeaderGlobalAction` supports `badge` slot ([15f3914](https://github.com/carbon-design-system/carbon-components-svelte/commit/15f3914726f7894f5cab1e20e037d56452bbfc86))
- **ui-shell:** `HeaderNavMenu` dispatches `close` event (#3308) ([a6bdc58](https://github.com/carbon-design-system/carbon-components-svelte/commit/a6bdc582322229d9b7e12e6affe31eff162825ac))
- **ui-shell:** `HeaderSearch` dispatches `close` event (#3318) ([9ba56ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ba56ed28810bcca9e272866e70991a1bd95111d))
- **ui-shell:** add `HeaderSideNavItems` for responsive header navigation ([6de282a](https://github.com/carbon-design-system/carbon-components-svelte/commit/6de282a4106cce82dbf32b12425fbc7b7e0acbe4)), closes [#516](https://github.com/carbon-design-system/carbon-components-svelte/issues/516)

### Bug Fixes

- **accordion-item:** remove chevron aria-label ([69b0305](https://github.com/carbon-design-system/carbon-components-svelte/commit/69b0305ee2a3bdb5c868eb4c2fe673aa39986483))
- **accordion-item:** rename `iconDescription` to `ariaLabel` for heading button ([72431ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/72431ea3d8e09ee1d1193d9fdc9866354daf724b))
- **biome:** enforce useSvelteRequireEachKey ([57a0c4b](https://github.com/carbon-design-system/carbon-components-svelte/commit/57a0c4b5a678d9d68030fa79dabde6dc039b8039))
- **breadcrumb:** fix overflow menu carets for small sizes (#3228) ([444c96b](https://github.com/carbon-design-system/carbon-components-svelte/commit/444c96bbd5c5259eab728aaedc313592f1bb853f))
- **checkbox:** preserve consumer title and stop mutating the prop ([122cb88](https://github.com/carbon-design-system/carbon-components-svelte/commit/122cb88876aaa7e0c19c9255193c3648c63c4d5c))
- **code-snippet:** avoid overwriting consumer-controlled `showMoreLess` prop (#3191) ([23cdbf5](https://github.com/carbon-design-system/carbon-components-svelte/commit/23cdbf5227d50d09e27eae5ab88205866ed55a70))
- **code-snippet:** close portalled tooltip after feedback timeout ([bbd144a](https://github.com/carbon-design-system/carbon-components-svelte/commit/bbd144a32c9198b6fb9066981aaf0a0a4b73195f))
- **code-snippet:** suppress native copy feedback caret for portalled tooltips for inline type ([05044ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/05044ca11e6ce6fbbf98a1aea3ec645ccd182d97))
- **combo-box:** add arrow key support for opening/closing the menu (#3254) ([bb1e92d](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb1e92dfc0d9541913d10b30dbe4ec6ba6cb449d))
- **combo-box:** clear hover highlight when cursor leaves the menu ([0247728](https://github.com/carbon-design-system/carbon-components-svelte/commit/024772850cafe86682c6cda8be664de8ab64113c))
- **combo-box:** derive virtualized item height from size ([3987ef1](https://github.com/carbon-design-system/carbon-components-svelte/commit/3987ef132914f3239c7d5bd4f2181e960a2c3e97))
- **combo-box:** remove invalid listbox role from the root element (#3262) ([01ec189](https://github.com/carbon-design-system/carbon-components-svelte/commit/01ec18938de9ff6013793e0d62ff1053c91b110b))
- **combo-box:** scope option ids per instance (#3176) ([135bb17](https://github.com/carbon-design-system/carbon-components-svelte/commit/135bb17ceaaf23d7e8dc962cfd6a8f34fe9f94d6))
- **composed-modal:** add keyed each for secondary buttons ([975e7d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/975e7d55ee1f02355eeb50c4f3bead695eff012e))
- **content-switcher:** skip disabled switches during keyboard navigation (#3204) ([f0945a2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f0945a28ac51a606dbb815489cbbdb74c4bff358))
- **copy-button:** close portalled tooltip after feedback timeout ([c8a9d56](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8a9d56cf67d7428a2b870c9714f16fba6f39829))
- **css:** replace `:has()` with marker classes for browser baseline (#3256) ([130be4c](https://github.com/carbon-design-system/carbon-components-svelte/commit/130be4c0b66e9da8203393d90640ba0756e904f7))
- **data-table:** associate cells with column headers (#3162) ([f8806aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8806aa570943a0894345c95fb2d8a653cc4ba2d))
- **data-table:** scope expandable row ids per instance (#3178) ([178c463](https://github.com/carbon-design-system/carbon-components-svelte/commit/178c46392069ce0c8f5d9b6f690b95bb90d41691))
- **data-table:** sticky header supports empty column and column menu (#3301) ([3a410c9](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a410c9f8ade87b28b8c161565a0e31796b0071d)), closes [#1492](https://github.com/carbon-design-system/carbon-components-svelte/issues/1492) [#440](https://github.com/carbon-design-system/carbon-components-svelte/issues/440)
- **dropdown:** add Alt+Arrow support for opening/closing the menu (#3257) ([addb4cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/addb4cf1509ec7cef78380420fd3eb31841e7ffe))
- **dropdown:** clear hover highlight when cursor leaves the menu ([01f24d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/01f24d395b0ef1706f7907e113b71ce7cae9ef0f))
- **dropdown:** derive virtualized item height from size ([ff17f9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff17f9c4b731241eae7a07811c62a4c197a460f7))
- **dropdown:** scope option ids per instance (#3177) ([d89a7fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/d89a7fcf6879284e4db5ce03e0eb64e653764234))
- **expandable-tile:** add aria-label to chevron toggle button (#3306) ([f75073f](https://github.com/carbon-design-system/carbon-components-svelte/commit/f75073f7c8f383858fa20d875cb8f1e8aa25a5ef))
- **expandable-tile:** link `aria-controls` to below-the-fold content (#3305) ([f019d6e](https://github.com/carbon-design-system/carbon-components-svelte/commit/f019d6e7ae36088886952775fdadac08c5cd3e2a))
- **expandable-tile:** resize if bound element changes (#3180) ([53b84e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/53b84e6ce95cd00fb0cf1893182670843d568de6))
- **expandable-tile:** stop measurements clobbering bound props (#3197) ([b3b8c89](https://github.com/carbon-design-system/carbon-components-svelte/commit/b3b8c896f681b00af9bec04825afa60987d55f78))
- **file-uploader-button:** join `accept` explicitly if array ([2e81e7d](https://github.com/carbon-design-system/carbon-components-svelte/commit/2e81e7d99894755743e28c45cd4283229cc59410))
- **file-uploader-drop-container:** join `accept` explicitly if array ([a7596f3](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7596f394e1c92aa604831f575aa9c6c89b58fe3))
- **file-uploader:** consolidate button role onto drop container label (#3307) ([40614ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/40614ba12711dc3ba2e3890cb8433e8ee0670493))
- **file-uploader:** expose `aria-disabled` on drop container (#3194) ([0dd9665](https://github.com/carbon-design-system/carbon-components-svelte/commit/0dd966521ea0b304dcb194da5cb16cbeb2a392ea))
- **local-storage:** persist object and array value mutations ([929590c](https://github.com/carbon-design-system/carbon-components-svelte/commit/929590c0b51724075e34e47b1e96d0c62bb1e5ea))
- **local-storage:** sync cross-tab key removal ([2681639](https://github.com/carbon-design-system/carbon-components-svelte/commit/268163934bccb45b5ff89cca248601a395754a96))
- **modal:** add keyed each for secondary buttons ([07d4cd7](https://github.com/carbon-design-system/carbon-components-svelte/commit/07d4cd74917f0f0d3a94d8e5c7f1419cc7a9c220))
- **modal:** prevent Enter on Cancel from also firing the primary action (#3279) ([eea7d45](https://github.com/carbon-design-system/carbon-components-svelte/commit/eea7d45e5e24d3a0612b757adaa1c3437d546377))
- **multi-select:** add Alt+Arrow support for opening/closing the menu (#3258) ([93dc6ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/93dc6ceb1f4034a2d3031b6ea27b027f734f8c59))
- **multi-select:** clear hover highlight when cursor leaves the menu ([7545f77](https://github.com/carbon-design-system/carbon-components-svelte/commit/7545f7783cfa4c5818251d4cc2b1d768dba459cf))
- **multi-select:** derive virtualized item height from size ([9ecd4b9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ecd4b95bc4c13d77661749bc6877905d71bb481))
- **multi-select:** fix selection if `portalMenu` is `true` (#3185) ([e391d66](https://github.com/carbon-design-system/carbon-components-svelte/commit/e391d66f26c09e996ea2cca3d8304663ac7f8c4e)), closes [#3170](https://github.com/carbon-design-system/carbon-components-svelte/issues/3170)
- **multi-select:** open menu when the field label is clicked (#3260) ([def97ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/def97cef13832a9f2ff1c12f962cc79b2f86fe5b))
- **multi-select:** restore focus outline on the field (#3259) ([3f38500](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f385004bbee7f911a0f7710eca51e52b20a0d01))
- **multi-select:** scope checkbox ids per instance (#3175) ([651633c](https://github.com/carbon-design-system/carbon-components-svelte/commit/651633c4a34f70bd20f075542e0088899573e9f3))
- **multi-select:** scope option ids per instance (#3179) ([179b636](https://github.com/carbon-design-system/carbon-components-svelte/commit/179b6369a2a9d6b64b90bae446865f8aa88a331c))
- **overflow-menu:** dispatch cancelable `close` before flipping `open` ([027b979](https://github.com/carbon-design-system/carbon-components-svelte/commit/027b979a0618e48a6f8048f6ddfdb8f11bbb65ba))
- **overflow-menu:** non-portalled `ul` is a sibling of the menu button (#3189) ([1c78bea](https://github.com/carbon-design-system/carbon-components-svelte/commit/1c78bea04614c4f6f7d71ce212e9a21b77510de2))
- **overflow-menu:** prevent scroll jump when opening portalled menu (#3338) ([ca4d51e](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca4d51e795e317aab0f0d201a0ff3ec446e5746e))
- **pagination-nav:** add keyed each for overflow options ([9992b54](https://github.com/carbon-design-system/carbon-components-svelte/commit/9992b54165590646fb380ced68f6c8295d7aadf1))
- **pagination-nav:** add keyed each for page items ([be59b86](https://github.com/carbon-design-system/carbon-components-svelte/commit/be59b865f0fcd1c97b7b70b8953dfc9ed54ae35d))
- **pagination:** cap rendered page options at `pageWindow` (#3005) ([687b3dd](https://github.com/carbon-design-system/carbon-components-svelte/commit/687b3dd036a503ab8904c2fd1e35c0d6a16a0c72))
- **pagination:** make `pagesUnknown` actually navigable ([9db0432](https://github.com/carbon-design-system/carbon-components-svelte/commit/9db0432060c8f6f03204e098eca4ba8668c78939))
- **pagination:** portal next/prev button tooltips ([0104782](https://github.com/carbon-design-system/carbon-components-svelte/commit/0104782ca96bedfd126a6bc9820c5f874bb1fa1d))
- **range-slider:** dispatch `change` from commit gestures, not reactive block ([6545d39](https://github.com/carbon-design-system/carbon-components-svelte/commit/6545d392f6f61d26d0a7103101bdb622e246d758))
- **session-storage:** persist object and array value mutations ([b28b872](https://github.com/carbon-design-system/carbon-components-svelte/commit/b28b87289d93a719ccc11941298025b6aea108d6))
- **session-storage:** sync cross-tab key removal ([22fea38](https://github.com/carbon-design-system/carbon-components-svelte/commit/22fea38033a670aeb9cdf31f635383f1085d8276))
- **skeleton-text:** add keyed each for paragraph lines ([db124d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/db124d2555bd4f2ce9abdab8e3ba618850e36c90))
- **slider:** clamp keyboard value and dispatch `change` from commit gestures ([66667cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/66667cfcd10d1aa50280dad4da0548382cfd0ea5))
- **tabs:** add keyed each in TabsSkeleton ([b3721ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/b3721aedf8c6d1a6e4fc5b37707b8f854d73f4b1))
- **tabs:** support Home/End keyboard shortcuts (#3208) ([3ba1c39](https://github.com/carbon-design-system/carbon-components-svelte/commit/3ba1c398c195c7867ba08b25eef247ffdf62cb97))
- **tabs:** user-provided `href` should not prevent default behavior ([12e95d1](https://github.com/carbon-design-system/carbon-components-svelte/commit/12e95d1a80120391ab61e63eb13e3e3a32a2246d)), closes [#2165](https://github.com/carbon-design-system/carbon-components-svelte/issues/2165)
- **tree-view:** prevent arrow keys from scrolling the page (#3165) ([6ff532d](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ff532de6899b77009c4c47f02947856afcbd7f5))
- **tree-view:** scope internal node ids per instance (#3209) ([2ce3564](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ce3564c57aaab6fc19b9776ada4f1b7e34e8d24))
- **utils:** apply maxItems cap in scrollHighlightedIntoView ([865a489](https://github.com/carbon-design-system/carbon-components-svelte/commit/865a489730682da51d6678998bcaf46e5a93aa00))
- **utils:** clamp virtualize `scrollTop` to the scrollable range (#3236) ([7ebe5bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ebe5bd7da91a9a0826c0ec88127a7772fbfec68))
- **utils:** render unvirtualized when itemHeight is non-positive ([ca3e2ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca3e2adcf299c95f13deeb0edfc4e3e0ddbb5e64))

### Performance

- **combo-box:** register outside-click listener only while open ([2849c2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/2849c2a58dfe29a6d2f0b32d72a68d067e7c132d))
- **context-menu:** gate outside-click and Escape listeners on open ([08d0a5e](https://github.com/carbon-design-system/carbon-components-svelte/commit/08d0a5e6f522245a201a7e44a70fcb37197f667a))
- **context-menu:** register option hover listener only while submenu open ([94b9d8f](https://github.com/carbon-design-system/carbon-components-svelte/commit/94b9d8fc491c73cb5b62e982c76b897abc5aa03d))
- **date-picker:** cache top-layer ancestor for outside-click checks ([08623ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/08623ba9cfa856216a6d5e8a94e823055c79eefe))
- **date-picker:** register outside-click listener only while calendar is open ([61dc601](https://github.com/carbon-design-system/carbon-components-svelte/commit/61dc60196aab134e803178484b2e6322cb502c0c))
- **dismiss:** pool window listeners by type, options ([356654a](https://github.com/carbon-design-system/carbon-components-svelte/commit/356654ab72dfe91a80021de23d80de97b47b61cf))
- **dropdown:** register outside-click listener only while open ([5e9bcb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e9bcb03dfecab6c392b8c282e03fa6d0d4d2186))
- **multi-select:** register outside-interaction listeners only while open ([aabc309](https://github.com/carbon-design-system/carbon-components-svelte/commit/aabc3098b9dff18cabd8534669941cc73186465b))
- **overflow-menu:** register outside-click listener only while open ([6afb3f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/6afb3f8d38b1c0f7866995839fb277975cf985cd))
- **popover:** register outside-click listener only while open ([9494e0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9494e0cbbdd495a0d1e6546e41ad07e3c58e7ad7))
- **range-slider:** register drag listeners only while dragging ([3b63e25](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b63e251fcafc0322ae78b43dfc7d98762bb431f))
- **slider:** register drag listeners only while dragging ([a626f77](https://github.com/carbon-design-system/carbon-components-svelte/commit/a626f775223af744fdc984e241cecc59066ea74c))
- **tooltip-definition:** register Escape listener only while open ([37c99af](https://github.com/carbon-design-system/carbon-components-svelte/commit/37c99af79dae1f1dfd6cc0b0597890969fc9808b))
- **tooltip-icon:** register Escape listener only while open ([3bbbf09](https://github.com/carbon-design-system/carbon-components-svelte/commit/3bbbf09e336df690ede9d1cae729101e0c1ebf82))
- **ui-shell:** register Header outside-interaction listeners only while open ([52f5222](https://github.com/carbon-design-system/carbon-components-svelte/commit/52f5222ba061acacd1bbc1af032cccc58a62f556))

### [0.108.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.108.0...v0.108.1) (2026-06-07)

### Bug Fixes

- **accordion-item:** remove chevron aria-label ([16acde3](https://github.com/carbon-design-system/carbon-components-svelte/commit/16acde3459c6287547d140ae84d7c8b03e029124))
- **code-snippet:** avoid overwriting consumer-controlled `showMoreLess` prop (#3191) ([1e32d62](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e32d62e0fb2561c794694cdb8b299012c342101))
- **code-snippet:** close portalled tooltip after feedback timeout ([41d5ca2](https://github.com/carbon-design-system/carbon-components-svelte/commit/41d5ca243b4de3c13d06221ff07bb24457a161ed))
- **code-snippet:** suppress native copy feedback caret for portalled tooltips for inline type ([bb0c534](https://github.com/carbon-design-system/carbon-components-svelte/commit/bb0c534df460ff06a98bdbf5bf3a53a257de79f7))
- **combo-box:** scope option ids per instance (#3176) ([6f8cf7c](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f8cf7c5fcca66041b11e9f0ad9d29a42050c6cd))
- **copy-button:** close portalled tooltip after feedback timeout ([8d5ab9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8d5ab9d390cbad3563e0e0cfc06c314232252f33))
- **data-table:** associate cells with column headers (#3162) ([152c6bb](https://github.com/carbon-design-system/carbon-components-svelte/commit/152c6bb87412ebc6a91e252f4d690c984d0cc74f))
- **data-table:** scope expandable row ids per instance (#3178) ([9317243](https://github.com/carbon-design-system/carbon-components-svelte/commit/9317243b0fd504a76c3af2ee20d4127014ce503c))
- **dropdown:** scope option ids per instance (#3177) ([9d8e1e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d8e1e93753e78e960502acf41229fef2e57b91d))
- **expandable-tile:** resize if bound element changes (#3180) ([121bb13](https://github.com/carbon-design-system/carbon-components-svelte/commit/121bb13c13ab1b06804001c32b257a829a773c2b))
- **expandable-tile:** stop measurements clobbering bound props (#3197) ([d972e03](https://github.com/carbon-design-system/carbon-components-svelte/commit/d972e03dd1fd25ac1e26ad184cc6f8e04dc7cdcf))
- **file-uploader-button:** join `accept` explicitly if array ([75cc63a](https://github.com/carbon-design-system/carbon-components-svelte/commit/75cc63a3528e4804e25691eecbd7c2a4ef77c212))
- **file-uploader-drop-container:** join `accept` explicitly if array ([b298c87](https://github.com/carbon-design-system/carbon-components-svelte/commit/b298c8798f695a4a1f427d6815eeb7df3ab75ed2))
- **file-uploader:** expose `aria-disabled` on drop container (#3194) ([249d604](https://github.com/carbon-design-system/carbon-components-svelte/commit/249d604d2966a7f0246a727ea91e58895cf7cc9a))
- **multi-select:** fix selection if `portalMenu` is `true` (#3185) ([bdb4c0e](https://github.com/carbon-design-system/carbon-components-svelte/commit/bdb4c0ec0914d35f7776918a8533766c5ac76d8c)), closes [#3170](https://github.com/carbon-design-system/carbon-components-svelte/issues/3170)
- **multi-select:** scope checkbox ids per instance (#3175) ([d96e65b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d96e65bab0d26d28ba2797b215dfb66517679fde))
- **multi-select:** scope option ids per instance (#3179) ([19042d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/19042d86b28300e7ac7bface5f515d84906a3e09))
- **overflow-menu:** dispatch cancelable `close` before flipping `open` ([5b3410c](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b3410c5ee0e1a2829d68e9c65eb24db181ce313))
- **overflow-menu:** non-portalled `ul` is a sibling of the menu button (#3189) ([3fb0cda](https://github.com/carbon-design-system/carbon-components-svelte/commit/3fb0cdaa520a5e53c73742c5baa56bef14615973))
- **tree-view:** prevent arrow keys from scrolling the page (#3165) ([b78fd2b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b78fd2bae6d33fa39140a3bf1ff72e58ade69c55))

### [0.108.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.107.1...v0.108.0) (2026-06-05)

### ⚠ BREAKING CHANGES

- **date-picker-skeleton:** replace unused `label` with `span` (#2890) ([214e42a](https://github.com/carbon-design-system/carbon-components-svelte/commit/214e42a28d73dcc59b015443f362924547f0cd08))
- **inline-notification:** remove decorative `statusIconDescription` prop ([6595f97](https://github.com/carbon-design-system/carbon-components-svelte/commit/6595f97b60671b37fb8463852376248344187b40))
- **notification-icon:** remove decorative `iconDescription` prop ([985e97d](https://github.com/carbon-design-system/carbon-components-svelte/commit/985e97dafd642cdb7fdaf30568d4a5ab5d6229b6))
- **notification-queue:** remove decorative `statusIconDescription` prop ([6642c8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6642c8e9461fe201dffc63a1327e4ef6a571f3bb))
- **toast-notification:** remove decorative `statusIconDescription` prop ([4017539](https://github.com/carbon-design-system/carbon-components-svelte/commit/401753991f1f2c5e4dc82bea24931865b9c673e1))

### Features

- **accordion-item:** add `ref` prop for button reference (#2938) ([e63b302](https://github.com/carbon-design-system/carbon-components-svelte/commit/e63b302dc96a19017f0d1cd613bd43dfc6d5ac39))
- **breadcrumb:** add `labelText` prop for the nav `aria-label` (#2950) ([b9170cc](https://github.com/carbon-design-system/carbon-components-svelte/commit/b9170ccc4365338e439756d5e527cf8704b41ead))
- **breadcrumb:** support small size ([eaaea14](https://github.com/carbon-design-system/carbon-components-svelte/commit/eaaea14b1953579aeba9789106b06288474bf74b))
- **checkbox-group:** add `readonly` prop ([cb4aee8](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb4aee8a5b89a415ffdc69234629a1828f31d86b))
- **clickable-tile:** add `ref` prop for link reference (#2956) ([14cff9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/14cff9b12f03ae8020db818030dda5e5cfcabeff))
- **code-snippet:** add `feedbackIcon` prop ([ba60010](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba6001095babee8e266b6e4793f5cb38f1c5145e))
- **code-snippet:** dispatch namespaced copy-button hover events ([72f10a3](https://github.com/carbon-design-system/carbon-components-svelte/commit/72f10a3f5ef07b2fd30cc054ea2efa24748ce539))
- **code-snippet:** forward copy:error from copy control ([c37fed7](https://github.com/carbon-design-system/carbon-components-svelte/commit/c37fed77f8860328d331e6dd7be750cf1f23af56))
- **code-snippet:** support async copy for inline variant ([848dc42](https://github.com/carbon-design-system/carbon-components-svelte/commit/848dc42a2bdaf31818131d4f2000deb15ea35f1b))
- **combo-box:** add readonly state ([9e90531](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e90531a5a3e61194fb67280e18ea291951317ae))
- **content-switcher:** add `ref` prop for tablist reference (#2980) ([449ac74](https://github.com/carbon-design-system/carbon-components-svelte/commit/449ac7425fe5c9c5500ba7ccc1bd37b43b4c586f))
- **context-menu:** add `labelText` prop ([afb62a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/afb62a7768c28922e7c6615ee805082e7f178a24))
- **context-menu:** support Home/End keyboard shortcuts (#2974) ([790b4f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/790b4f628c0382eab7b681725919acdc1bb7bade))
- **copy-button:** add `feedbackIcon` prop ([722aaba](https://github.com/carbon-design-system/carbon-components-svelte/commit/722aaba38864f638ce806c3eaee409c8e54816f0))
- **copy-button:** forward more events to button ([6fa8f13](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fa8f13e575fb78ca4999146d220c6fabdd864ea))
- **copy-button:** support async `copy` ([35ba6d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/35ba6d538f33b7aace30abaacff95378bf7e8453))
- **data-table:** `DataTableEmptyHeader` type uses discriminated union ([c8c77a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/c8c77a9f5ad8dc09f7ac97735c6ef88f2133a55f))
- **data-table:** `on:sort` type uses discriminated union ([25e8f15](https://github.com/carbon-design-system/carbon-components-svelte/commit/25e8f155ccf1de4507e996cb4922501f24e3b8d0))
- **date-picker-input:** support `readonly` prop ([7ba5d15](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ba5d157332ce024041d14d94c6aee7b57412723))
- **date-picker-skeleton:** add `short` prop ([4e7c55d](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e7c55d64c3cec6808cb2ed850e5d560a4bed5b4))
- **date-picker:** export `calendar` instance for programmatic control ([6fc4103](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fc4103738f86d2f69c5ca2331e13349b2e91699))
- **dropdown:** add readonly state ([a4c04dc](https://github.com/carbon-design-system/carbon-components-svelte/commit/a4c04dcdd6e33679aed51e2e3eac8d80840ae7c3))
- **file-uploader-button:** add `preventDuplicate` prop ([3a9c8bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a9c8bc8c5c8b97438b9d588aba16e5b5ef9a02b))
- **file-uploader:** expose `ref` to inner input element ([914cfbf](https://github.com/carbon-design-system/carbon-components-svelte/commit/914cfbffcd8ff76cb25fae4c515faaa373048a03))
- **fluid-form:** add `ref` prop for form reference (#3056) ([582b17c](https://github.com/carbon-design-system/carbon-components-svelte/commit/582b17c884d0ced9c9422f5f85216d6ce36d93e1))
- **list-box-menu:** support `portalHostClass` prop ([a0caa3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0caa3a1e3347711c54ae795a6475e57982081ed))
- **list-box:** support readonly state ([2841dde](https://github.com/carbon-design-system/carbon-components-svelte/commit/2841dde8c7770a0fcdb10c330a960cc043d09fdf))
- **local-storage:** dispatch error event for write failures ([1b309c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/1b309c3485c3e6fd36d3740c13893418d4eb86b6))
- **multi-select:** add readonly state ([527c498](https://github.com/carbon-design-system/carbon-components-svelte/commit/527c4980ad6e5d2b67d398c989cb6c9f7563b1af))
- **multi-select:** expose `sortedItems` as a bindable prop ([99871e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/99871e82975b856f24af245c6ffeb57bcd4283c0))
- **notification-queue:** add `update` prop ([39c007c](https://github.com/carbon-design-system/carbon-components-svelte/commit/39c007cd3202d1ecf7c7c3a5a3f8eb12ad0fccc6))
- **outbound-link:** add `assistiveText` prop for screen readers (#3105) ([3a0b20a](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a0b20ae94015f00707d1aec86a949e86f5c0449))
- **overflow-menu:** support `disabled` button ([09c48f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/09c48f23539e58a57c9c80fda29726dabf49cf62))
- **overflow-menu:** support Home/End keyboard shortcuts (#2982) ([307a2e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/307a2e9a03df7b6bf001c42e5b9792b26105f7b4))
- **progress-indicator-skeleton:** add `spaceEqually` prop ([316aa9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/316aa9c867ed1c84556b6dbc5180a2f0eec4c18f))
- **progress-step:** icon is slottable ([ff55fe0](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff55fe0f2f62a65ad5bff9bb52255c85f77e4172))
- **radio-button:** add readonly state ([147f5be](https://github.com/carbon-design-system/carbon-components-svelte/commit/147f5be9f8808c4193acadfa3025649803c875bb))
- **recursive-list:** add `expressive` prop ([6c23ebe](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c23ebe227d02182339c47c9e7158998767fdc12))
- **recursive-list:** support link `target` and `rel` attributes (#3001) ([8ce5d57](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ce5d57f27ce20dca1d8145587ba960bbe267183))
- **recursive-list:** support optional `id` key ([4178e6d](https://github.com/carbon-design-system/carbon-components-svelte/commit/4178e6dd8deda8dc8fccc3ca2fa8feccafc5479a))
- **select:** support `readonly` prop ([e6b0521](https://github.com/carbon-design-system/carbon-components-svelte/commit/e6b052106a70593d8865fff321bcb18aec7c360e))
- **selectable-tile-group:** add `hideLegend` prop ([967518e](https://github.com/carbon-design-system/carbon-components-svelte/commit/967518e2a748b9f0a7092f98a3212ab3f4e447cf))
- **session-storage:** dispatch error event for write failures ([170dcd9](https://github.com/carbon-design-system/carbon-components-svelte/commit/170dcd934ab29d912876a841f9bb5673b7c1adb7))
- **slider:** add `RangeSlider` ([c9df655](https://github.com/carbon-design-system/carbon-components-svelte/commit/c9df6551bfd8ffbe492094b78f20496cdc57fe90))
- **structured-list-skeleton:** add `columns` prop ([cb87671](https://github.com/carbon-design-system/carbon-components-svelte/commit/cb876716a8c5230ff663f71c31c09a3972d8859f))
- **text-area:** add readonly state ([69944f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/69944f7dc585ec971fc7497784131f6bccc2a43d))
- **time-picker-select:** support readonly state ([060034c](https://github.com/carbon-design-system/carbon-components-svelte/commit/060034c32bd01dc3aeb0df9591ea9b0bd03fd821))
- **time-picker:** add `helperText` prop ([fdceb23](https://github.com/carbon-design-system/carbon-components-svelte/commit/fdceb235c1c6f859fdd00ba15eea07fe3194db83))
- **time-picker:** add warning state ([96ce7a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/96ce7a17dc3913ce8cee9d1a652b5e9f5ac96624))
- **time-picker:** support readonly state ([321d571](https://github.com/carbon-design-system/carbon-components-svelte/commit/321d57140352b5827cb9c735beaf788717ecd45c))
- **toggle:** add readonly state ([3f7968c](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f7968c687c429f63f53cd9c0e019dab7dc98cd5))
- **toolbar-search:** add `clear` accessor ([e047d1b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e047d1b50fcbfda2761c568db2baafa8d422ae4a))
- **toolbar:** add `ariaLabel` prop (#3027) ([58ffb05](https://github.com/carbon-design-system/carbon-components-svelte/commit/58ffb05ba2316cfbd69b6df6796300ba6170fa70))
- **ui-shell:** `HeaderSearch` supports optional `id` as key ([6ce6e72](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ce6e7200a3cd2e52fd835df77a89d5ad29fed11))

### Bug Fixes

- **breadcrumb-item:** improve description for slot usage ([da27d82](https://github.com/carbon-design-system/carbon-components-svelte/commit/da27d823e12966b3f5f7721ca8eba09c104a9060))
- **breadcrumb-item:** type `$$restProps` ([511dad9](https://github.com/carbon-design-system/carbon-components-svelte/commit/511dad977ea1d3eb9b72db7a80b68b1c2c33a189))
- **breadcrumb:** apply current class when `aria-current="page"` is set (#2953) ([811d74e](https://github.com/carbon-design-system/carbon-components-svelte/commit/811d74ec5be76b6b2c0a99b7b2bfc358751c2c9e))
- **breadcrumb:** avoid leaking `aria-current` onto `<li>` wrapper ([2ba5659](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ba5659fefcf8fd0f2b60e444de7cd5664a49ccd))
- **breadcrumb:** hide skeleton from assistive tech (#2951) ([88cdeea](https://github.com/carbon-design-system/carbon-components-svelte/commit/88cdeead7c19dcbb2026fc5daff2d616ca0f21f6))
- **breadcrumb:** set `aria-current="page"` on link when `isCurrentPage` is true (#2958) ([619a009](https://github.com/carbon-design-system/carbon-components-svelte/commit/619a009f26c13bfe9d57bb0a9abd673f4b6be703))
- **button:** dedupe size class logic (#2949) ([1152875](https://github.com/carbon-design-system/carbon-components-svelte/commit/11528752401c90e151763f89c6543c5c3526dc1b))
- **button:** omit `href` when `disabled` to avoid invalid `<button href>` (#2948) ([2accfdc](https://github.com/carbon-design-system/carbon-components-svelte/commit/2accfdc090f58a8421dc522d9e700bba4cc7b11c))
- **button:** remove redundant `aria-label` from icon (#2946) ([726fd8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/726fd8e66a4474cec1c74f76030aa80c7064fe16))
- **button:** set `rel="noopener noreferrer"` on `target="_blank"` anchors (#2945) ([227b7f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/227b7f972b8b4e4fe1d965892299e78a846e00f7))
- **checkbox-group:** unsubscribe from `selectedValue` on destroy ([743f668](https://github.com/carbon-design-system/carbon-components-svelte/commit/743f668d9736373be4198d452cde7d5306ff0a27))
- **checkbox:** associate `helperText` with input via `aria-describedby` (#3078) ([dad9946](https://github.com/carbon-design-system/carbon-components-svelte/commit/dad99467aa5e5c3283378d6160548fa529b36472))
- **checkbox:** prevent forwarded `change` event when `readonly` (#3080) ([ae4ec15](https://github.com/carbon-design-system/carbon-components-svelte/commit/ae4ec15dc865ee369facaa92029f6748d6a5cd94))
- **clickable-tile:** forward keyup/focus/blur events ([1469fe8](https://github.com/carbon-design-system/carbon-components-svelte/commit/1469fe8c404e3d976de2948ceca4297e7dcb7370))
- **clickable-tile:** guard `clicked` toggle when `disabled` (#2957) ([a166dec](https://github.com/carbon-design-system/carbon-components-svelte/commit/a166dec69d61a7144ff29c350d8d127b060f4654))
- **code-snippet:** default inline copy button label to "Copy code" (#2962) ([f7ef0a5](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7ef0a575ef2543c9e3c5b89fcd2801532e09e57))
- **code-snippet:** mark `textbox` container as readonly (#2964) ([f6e0b55](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6e0b55f460675aa0cf364dcab1bda0f4f0020d6))
- **code-snippet:** re-attach modal observer when `portalTooltip` toggles ([52ff178](https://github.com/carbon-design-system/carbon-components-svelte/commit/52ff17867446406dfe59dbb6dd1c670dcb3c10e9))
- **code-snippet:** remove redundant `aria-label` from expand chevron (#2963) ([d09da6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d09da6acfa93fd4ae48516ef9cc001cfa065d50e))
- **combo-box:** default `aria-activedescendant` to empty when none highlighted (#2918) ([1528a0a](https://github.com/carbon-design-system/carbon-components-svelte/commit/1528a0a2c6e82fd23d8c1a591a37561a8286b5e0))
- **combo-box:** index `aria-activedescendant` against filtered items (#2916) ([f142041](https://github.com/carbon-design-system/carbon-components-svelte/commit/f14204179a8126b28fe2fb19a8b0c5c778899935))
- **combo-box:** remove `aria-labelledby` shadowing label association (#2917) ([6dd5fb5](https://github.com/carbon-design-system/carbon-components-svelte/commit/6dd5fb5c5760486c3d81c2c6a9657c120cc1d229))
- **combo-box:** set `aria-haspopup="listbox"` on input (#2914) ([f2a38d3](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2a38d329537342791209e73f006fc91b8a64e37))
- **combo-box:** suppress invalid/warn states when disabled or read-only ([eabd15e](https://github.com/carbon-design-system/carbon-components-svelte/commit/eabd15e66ee6417970a4d488b383dea5b5536865))
- **combo-box:** wire `aria-describedby` to helper/error/warn messages ([988f688](https://github.com/carbon-design-system/carbon-components-svelte/commit/988f68814b613b8b39df6702a11ef30f71f43250))
- **contained-list:** remove redundant `role="list"` (#3041) ([7281df4](https://github.com/carbon-design-system/carbon-components-svelte/commit/7281df4999819bdc0397d471a1c756e567db6ae9))
- **content-switcher:** forward focus/blur events ([a1c1547](https://github.com/carbon-design-system/carbon-components-svelte/commit/a1c1547dc2298a2c5c5c2a42d7bb07c5fb3e796e))
- **content-switcher:** scope tab lookup to registered switches (#2970) ([ea7c038](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea7c03867b824b8af25512e80445ee7c1b50d11f))
- **content-switcher:** support Home/End keyboard shortcuts (#2968) ([c537e62](https://github.com/carbon-design-system/carbon-components-svelte/commit/c537e625711b18649611a4480c41ec73d2fa3a85))
- **content-switcher:** sync switch order to DOM on conditional render ([b549fbf](https://github.com/carbon-design-system/carbon-components-svelte/commit/b549fbfbba0791c64785df167536b45f37ce332e))
- **content-switcher:** unregister `Switch` from parent on destroy (#2969) ([6b778e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b778e7ee7ea3578fc40457eb6c6ddeac40c2257))
- **context-menu-option:** apply `aria-disabled` to submenu triggers ([9bb37d0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9bb37d05a09ee5322ad8cfaeaf8117e855c5725b))
- **context-menu-option:** disabled leaf option should not close the menu ([95f3ad0](https://github.com/carbon-design-system/carbon-components-svelte/commit/95f3ad02f5ebbacf1c479a8a724ce2485db19b7b))
- **context-menu-option:** only apply class if `disabled` (#2972) ([6b00578](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b00578d0ed3819c8b580b96680b9d8fec7c7b04))
- **context-menu:** dispatch open/close only on open-state transitions (#2975) ([acd8d99](https://github.com/carbon-design-system/carbon-components-svelte/commit/acd8d991e54b889ef043c7b8c1fffb4fd87841e7))
- **context-menu:** rebind listeners when target changes (#2977) ([df13db3](https://github.com/carbon-design-system/carbon-components-svelte/commit/df13db3b6f755332198bc1e324af28526d8f4b63))
- **context-menu:** reset role to "menuitem" when option no longer selectable (#2976) ([055b271](https://github.com/carbon-design-system/carbon-components-svelte/commit/055b271fe28f4ec0a36a901ae7aa9d1cd658d18d))
- **copy-button:** avoid dispatching "copy" event if already clicked (#3141) ([5c97a64](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c97a644dab470eb08731f7331d61a8054343234))
- **copy-button:** re-attach modal observer when `portalTooltip` toggles ([bd9c862](https://github.com/carbon-design-system/carbon-components-svelte/commit/bd9c86221e873d7f88f8c6516dee5f0bb46f6f74))
- **css:** suppress native copy feedback caret for portalled tooltips (#2961) ([45d9234](https://github.com/carbon-design-system/carbon-components-svelte/commit/45d923406f81d459c613413b1d40f91283fb3a9b))
- **data-table:** `click:header` reports intended direction even when `sort` is cancelled (#2940) ([e66b7f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/e66b7f979e926402e8484cac485b0b6b9a3f3e33))
- **data-table:** detect in-place row mutations in cell cache (#2941) ([e37a8f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/e37a8f88f04cff9d60d0ae681bb2146e8830a192))
- **data-table:** preserve active filter when `rows` prop changes (#2944) ([fd4e9f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/fd4e9f641c98f44ebae9721ba78f084f04ae546b))
- **data-table:** scope `TableHeader` ids to the `DataTable` instance (#2939) ([a669092](https://github.com/carbon-design-system/carbon-components-svelte/commit/a669092390eabe209d436845f6c513a0eb51d50e))
- **date-picker-input:** forward `focus` event to input (#2889) ([e844c76](https://github.com/carbon-design-system/carbon-components-svelte/commit/e844c7631ff3a730fc2c6300ed87d7ddd5203f42))
- **date-picker-skeleton:** replace unused `label` with `span` (#2890) ([214e42a](https://github.com/carbon-design-system/carbon-components-svelte/commit/214e42a28d73dcc59b015443f362924547f0cd08))
- **date-picker:** avoid animation flicker if calendar is already open (#2888) ([961670c](https://github.com/carbon-design-system/carbon-components-svelte/commit/961670cfafa1f57c382d06c4e74dc53b28eae63f))
- **date-picker:** constrain input width if `helperText` is longer than input ([829a6c5](https://github.com/carbon-design-system/carbon-components-svelte/commit/829a6c53766cc51dd75d07ca3cb80925de032e3b))
- **date-picker:** disabled state icon uses correct color ([135d046](https://github.com/carbon-design-system/carbon-components-svelte/commit/135d04686dfc720c07569997fc3b24b9292732c1))
- **date-picker:** portalled menu should track scroll/resize events ([71c713c](https://github.com/carbon-design-system/carbon-components-svelte/commit/71c713ccaa9bbdabfaf276328e9fcf0738d1f752))
- **date-picker:** restore single-letter weekday abbreviations for `locale="en"` ([c450d81](https://github.com/carbon-design-system/carbon-components-svelte/commit/c450d817c39a73920fe476184e941b1a62f57d6f))
- **date-picker:** style disabled month nav buttons ([39b3fd3](https://github.com/carbon-design-system/carbon-components-svelte/commit/39b3fd37431e05c32e49656d2982730efb4b5943))
- **date-picker:** suppress invalid/warn states when disabled or read-only ([4d9fa04](https://github.com/carbon-design-system/carbon-components-svelte/commit/4d9fa04c688891dec23920c3cf7c1bd8a682c5b6))
- **dropdown:** exclude "Space" from typeahead buffer (#2928) ([f246af8](https://github.com/carbon-design-system/carbon-components-svelte/commit/f246af89bb47ae7311ed51375a49e0ca5190ae7f))
- **dropdown:** gate `aria-controls` on `open` (#2927) ([3213964](https://github.com/carbon-design-system/carbon-components-svelte/commit/3213964326b0f7f5b83ada3157470dab5eb9edcf))
- **dropdown:** scroll selected option into view when menu overflows ([6bc4d64](https://github.com/carbon-design-system/carbon-components-svelte/commit/6bc4d644cfbc248f69467b966070f242ae720022))
- **dropdown:** suppress invalid/warn states when disabled or read-only ([3a9eb2e](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a9eb2e9d308204d77e00aaee0abb38d2e611588))
- **dropdown:** wire `aria-describedby` to helper/error/warn messages (#2932) ([62b7677](https://github.com/carbon-design-system/carbon-components-svelte/commit/62b76773461621856b2dbb5707ed5c7d73d509ab))
- **file-uploader:** stable per-file ids for add/remove events (#3017) ([88b4264](https://github.com/carbon-design-system/carbon-components-svelte/commit/88b426426d445b93f42cb058cf542a4b77f41d30))
- **inline-loading:** clear success timer before rescheduling ([00f283d](https://github.com/carbon-design-system/carbon-components-svelte/commit/00f283d1ff548bf2860607cefdfa62db50aab86c))
- **inline-notification:** remove decorative `statusIconDescription` prop ([6595f97](https://github.com/carbon-design-system/carbon-components-svelte/commit/6595f97b60671b37fb8463852376248344187b40))
- **inline-notification:** type `role` as "alert" | "log" | "status" ([39c4308](https://github.com/carbon-design-system/carbon-components-svelte/commit/39c4308ce18d29edb423ac9978bee8a043297265))
- **link:** forward focus/blur/keydown/keyup events ([e3526be](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3526be41360f85cb30e7608513c6bca5db92663))
- **list-box:** add safer guard for rendering invalidText/warnText ([57c828b](https://github.com/carbon-design-system/carbon-components-svelte/commit/57c828b407dc3189fc2c157d02c7eabf330d5124))
- **local-storage:** drop stray argument from internal `setItem` calls ([d59de93](https://github.com/carbon-design-system/carbon-components-svelte/commit/d59de932ee2e4303398b1411dd0246df5d6baff1))
- **local-storage:** sync `prevValue` after reactive key change ([fa68b4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/fa68b4db0d37bcf4e4f99342a4efdef8b8cd8dd8))
- **modal:** implement body scroll lock ([da2e81c](https://github.com/carbon-design-system/carbon-components-svelte/commit/da2e81c4a28a07dcb8e580956ede86f69e630367))
- **modal:** skip Enter submit when target is textarea/select/contenteditable (#2994) ([a277c1a](https://github.com/carbon-design-system/carbon-components-svelte/commit/a277c1a5b5fa11ca918183a2d72032d1c980eae0))
- **multi-select:** apply wrapper classes to portal host if `portalMenu` is `true` ([2392bad](https://github.com/carbon-design-system/carbon-components-svelte/commit/2392bad39b4ce0734b2068531a89062d69f93cd7))
- **multi-select:** close menu on focus leaving wrapper (#2920) ([c458505](https://github.com/carbon-design-system/carbon-components-svelte/commit/c45850577bc807efba74858267df54e58b11d298))
- **multi-select:** do not open menu on filterable input focus (#2921) ([eb3d754](https://github.com/carbon-design-system/carbon-components-svelte/commit/eb3d754f4115b7f5e3fbd242d6ce3865dc417c32))
- **multi-select:** preserve bound `value` on non-filterable close (#2924) ([0fd75dc](https://github.com/carbon-design-system/carbon-components-svelte/commit/0fd75dc9db425993c7ae46512dc355edda8e9573))
- **multi-select:** recompute `sortedItems` when `items` prop changes (#2922) ([0d29494](https://github.com/carbon-design-system/carbon-components-svelte/commit/0d294944869fd357dac501f51817b5396ef64bdd))
- **multi-select:** remove `aria-labelledby` shadowing label association (#2923) ([84de7ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/84de7acb60216858400c4fce2a2420cfc3b0fa0d))
- **multi-select:** set `aria-haspopup="listbox"` on input (#2919) ([59de2ab](https://github.com/carbon-design-system/carbon-components-svelte/commit/59de2abc8c6df9f6cae5011ad27fcfb5b1faaffa))
- **multi-select:** suppress invalid/warn states when disabled or read-only ([12e464a](https://github.com/carbon-design-system/carbon-components-svelte/commit/12e464a253f1cc060a997cea583c09a9bf61c08d))
- **notification-icon:** remove decorative `iconDescription` prop ([985e97d](https://github.com/carbon-design-system/carbon-components-svelte/commit/985e97dafd642cdb7fdaf30568d4a5ab5d6229b6))
- **notification-queue:** remove decorative `statusIconDescription` prop ([6642c8e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6642c8e9461fe201dffc63a1327e4ef6a571f3bb))
- **number-input:** set `aria-readonly` for readonly state (#3037) ([6c896ca](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c896ca0d853f1243e7a0165ff77eed9155baa50))
- **outbound-link:** forward focus/blur/keydown/keyup events ([1fff120](https://github.com/carbon-design-system/carbon-components-svelte/commit/1fff120ce405f86dbd6dca10a8b0f042e471e17a))
- **overflow-menu-item:** `primaryFocus` should not be reactive (#2987) ([9538612](https://github.com/carbon-design-system/carbon-components-svelte/commit/95386124f6285c8b54f5f3d9246f426713e910d1))
- **overflow-menu-item:** set `aria-disabled` on disabled link (#2983) ([38bfc44](https://github.com/carbon-design-system/carbon-components-svelte/commit/38bfc44b1f8c50034c03d2c191d43976fe69bbd3))
- **overflow-menu:** `aria-controls` is stable (#2986) ([bff1477](https://github.com/carbon-design-system/carbon-components-svelte/commit/bff14778e6432293f218cd767ff80b2b35c03f9c))
- **overflow-menu:** prevent infinite loop when all items are disabled (#2984) ([388ef46](https://github.com/carbon-design-system/carbon-components-svelte/commit/388ef46a474e3ab076dacb4d5914f900b8486649))
- **overflow-menu:** self-unregister items on destroy (#3011) ([905e08a](https://github.com/carbon-design-system/carbon-components-svelte/commit/905e08ab5c6faecfc0fb7e6a105d0eb4b011cd41))
- **overflow-menu:** use `aria-haspopup="menu"` (#2985) ([fe5b44d](https://github.com/carbon-design-system/carbon-components-svelte/commit/fe5b44d3065c62a3155f0db69f632b40b9aec2bb))
- **overflow-menu:** use `SvelteHTMLElements` to type target/rel props (#3003) ([6b25d75](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b25d757d68a317dd57f694ebedc90b6b80686b3))
- **package:** include CSS type definitions in `package.json` exports map ([e806405](https://github.com/carbon-design-system/carbon-components-svelte/commit/e806405b9fb6ad6bec015d75f725cbe0702b0c77))
- **pagination-nav:** announce current page as 1-based in live region (#3070) ([58b1ce5](https://github.com/carbon-design-system/carbon-components-svelte/commit/58b1ce52655578d69f34edc6fbfda7e25d47d2ed))
- **pagination-nav:** label active middle page with "Active, Page" (#3071) ([e8f1d5b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e8f1d5b3d196c6cd31048cdda0b606f3eaae5772))
- **pagination:** use clear suffixes for internal IDs (#2990) ([2f05cab](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f05cabaf861304c20df67738b4a044aeb009a8d))
- **progress-bar:** associate label via `aria-labelledby` (#3074) ([5875281](https://github.com/carbon-design-system/carbon-components-svelte/commit/58752817e3c3b5b606157ba0c06de93207a6028f))
- **progress-indicator:** remove unmounted steps from context (#3049) ([44780e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/44780e3afa28dc33c7535638a17f59276701aa16))
- **progress-step:** dispatch `change` once per keypress (#3054) ([9923f8f](https://github.com/carbon-design-system/carbon-components-svelte/commit/9923f8ff84860c314c89b62b51658efe83ea9453))
- **progress-step:** do not throw if rendered outside context (#3081) ([2437a06](https://github.com/carbon-design-system/carbon-components-svelte/commit/2437a06a576d7ecec7ad0346759a51120c49655b))
- **progress-step:** forward focus/blur events (#3055) ([2eb3cdd](https://github.com/carbon-design-system/carbon-components-svelte/commit/2eb3cddd0a803772b2f7104f3b3df538767ee225))
- **radio-button-group:** associate `helperText` via `aria-describedby` (#3085) ([6b3b95e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b3b95eed08d6761fa778105378657d703ad5815))
- **radio-button-group:** unsubscribe from `selectedValue` on destroy (#3061) ([6e90822](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e908222af8d5e4ea519a9cb783f502cb5791641))
- **select:** add missing warn icon/text for inline variant (#2913) ([768ab48](https://github.com/carbon-design-system/carbon-components-svelte/commit/768ab480ad7c43f3d6768eb9f6b3461d1ba2cbcf))
- **select:** suppress invalid/warn states when disabled or read-only ([62df7cd](https://github.com/carbon-design-system/carbon-components-svelte/commit/62df7cd4b2b3704bf86c7de9a50d348d62801610))
- **selectable-tile:** announce label as checkbox to screen readers (#3075) ([be497f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/be497f886c04ef7d7a10c9fa0f445835c13ea65b))
- **selectable-tile:** hide checkmark icon from assistive technology (#3107) ([dea0830](https://github.com/carbon-design-system/carbon-components-svelte/commit/dea0830e47369325f7906674b81c4125c457e23d))
- **selectable-tile:** re-register with group when value changes (#3067) ([4928d32](https://github.com/carbon-design-system/carbon-components-svelte/commit/4928d325a9b38d93933a24ce47eca274804969aa))
- **selectable-tile:** set `aria-disabled` for disabled state (#3065) ([ec4265d](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec4265dfcb1d39adb152f57b2633150668ae1dff))
- **session-storage:** drop stray argument from internal `setItem` calls ([bf72abf](https://github.com/carbon-design-system/carbon-components-svelte/commit/bf72abf373d41fde562b5132591859b462e0993d))
- **session-storage:** sync `prevValue` after hydration and reactive key change ([d5d81c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5d81c307d0a847a2c9f945cc61643d0695c4f14))
- **slider:** move keyboard handler to thumb with role="slider" (#3092) ([bcb35f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/bcb35f62511b00fd77388d6c696519b52f1fd6da))
- **slider:** suppress invalid/warn states when disabled or read-only ([e8420df](https://github.com/carbon-design-system/carbon-components-svelte/commit/e8420df0845825147f9d19ec58c6161a96cc7b5e))
- **slider:** update value on click without drag (#3046) ([8692e6e](https://github.com/carbon-design-system/carbon-components-svelte/commit/8692e6e5fbfd0044df21f8ceb88d4036a1780123))
- **structured-list-input:** do not throw if rendered outside context (#3033) ([5139247](https://github.com/carbon-design-system/carbon-components-svelte/commit/5139247f125cbba48dde65ebc0afe5f491db50af))
- **structured-list-row:** make selectable rows keyboard-activatable (#3091) ([2a40eb5](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a40eb5ce3248c904820beb227e18fae133be869))
- **structured-list:** prevent dispatching initial "change" event (#3032) ([50cf228](https://github.com/carbon-design-system/carbon-components-svelte/commit/50cf228d83d938196aca3637b056307f70cd1b11))
- **switch:** forward focus/blur/keyup events ([bc7332e](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc7332ede6cc848060110bc74d5923f177b41ef1))
- **switch:** remove useless `preventDefault` modifier (#2967) ([57059a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/57059a8414898f7cd92be900a67138ddcaac367f))
- **tabs:** prevent infinite loop when all items are disabled (#3129) ([170f132](https://github.com/carbon-design-system/carbon-components-svelte/commit/170f1329ba56ff4038035114a8f6d8fbf58eb445))
- **tag:** `SelectableTag` uses `aria-pressed` instead of `aria-checked` (#3073) ([10b9c43](https://github.com/carbon-design-system/carbon-components-svelte/commit/10b9c43ac9aa1bee17c6c53d0555e20f8eb25dae))
- **time-picker-select:** forward change/input/focus/blur events (#2899) ([3565cc3](https://github.com/carbon-design-system/carbon-components-svelte/commit/3565cc31f762fd908e8481a2baaf723f7cb419fd))
- **time-picker:** associate `invalidText` with input via `aria-describedby` (#2894) ([1134104](https://github.com/carbon-design-system/carbon-components-svelte/commit/1134104c92371c63ef551d58c9638c12bdd6468b))
- **time-picker:** invalid state has icon (#2896) ([8bcf9fd](https://github.com/carbon-design-system/carbon-components-svelte/commit/8bcf9fd17ffcd0be01069c26df5bb33c9a75c9f2))
- **toast-notification:** remove decorative `statusIconDescription` prop ([4017539](https://github.com/carbon-design-system/carbon-components-svelte/commit/401753991f1f2c5e4dc82bea24931865b9c673e1))
- **toast-notification:** type `role` as "alert" | "log" | "status" ([3f65834](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f65834c41cf1af37cb05ff3f0c9e3d08cc86dc2))
- **toggle:** do not render empty label span when no label provided (#3137) ([0b06091](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b060913a0e857d6166c0c1a983bef61374aa20f))
- **toolbar-batch-actions:** stop mutating controlled `active` prop (#3022) ([d919dc5](https://github.com/carbon-design-system/carbon-components-svelte/commit/d919dc58f5e6409234739fb4e1fc0226b67e2797))
- **toolbar-content:** unsubscribe from `batchActionsActive` on destroy ([6b71325](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b71325267f16eca0b5c7227a03be8611e233848))
- **toolbar-menu:** reset parent overflow on unmount (#3029) ([b020cb3](https://github.com/carbon-design-system/carbon-components-svelte/commit/b020cb3d97d9a5be7db3c8850e04607309d7a020))
- **toolbar-search:** coerce `value` to string before reading length (#3023) ([046d233](https://github.com/carbon-design-system/carbon-components-svelte/commit/046d2339c69fc04825db2440b2202a6783f61a66))
- **toolbar-search:** skip expanded toggle when persistent (#3025) ([8c0aac9](https://github.com/carbon-design-system/carbon-components-svelte/commit/8c0aac9f6a4d845870738d73a17ad1815b78b2f9))
- **tooltip-footer:** do not throw if rendered outside context (#3047) ([07d7e63](https://github.com/carbon-design-system/carbon-components-svelte/commit/07d7e6331e77226ecf9fcfc28bcd365b8c721c41))
- **tree-view-item:** ArrowLeft on collapsed parent focuses its ancestor ([ade0f55](https://github.com/carbon-design-system/carbon-components-svelte/commit/ade0f5517b1d3ae6217ff45fa99eda0bf765784d))
- **tree-view-item:** ArrowRight reliably focuses the first child row ([924150f](https://github.com/carbon-design-system/carbon-components-svelte/commit/924150f978145425247f100141af5bdc7589a35b))
- **tree-view-item:** Enter toggles expand on parent; Space only selects ([ff54c2a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff54c2ac15d26f1ec4e721061e9c49e7babe5ec7))
- **tree-view-item:** export findParentTreeNode ([e7a2644](https://github.com/carbon-design-system/carbon-components-svelte/commit/e7a264414edc8ed7f54670ce7a92f14e0865e0b6))
- **tree-view-item:** wire aria-owns and aria-labelledby for subtree group ([faa3bab](https://github.com/carbon-design-system/carbon-components-svelte/commit/faa3bab0814a2dc9e43ec1a1418d78796812e71f))
- **tree-view:** arrow keys work with link rows (#3101) ([49b8db8](https://github.com/carbon-design-system/carbon-components-svelte/commit/49b8db89476d669f5f50c4a36b18dcf86ad18b3a))
- **tree-view:** re-apply first focusable tabindex when nodes change ([841355f](https://github.com/carbon-design-system/carbon-components-svelte/commit/841355fa97395074563919b41e2ca3a8f8d045d5))
- **tree-view:** roving tabindex resets the previous row on focus move ([f69710d](https://github.com/carbon-design-system/carbon-components-svelte/commit/f69710dd92ed0466b4e859026abcf6b900c80779))
- **tree-view:** support Ctrl+A to select all in multiselect ([a07027f](https://github.com/carbon-design-system/carbon-components-svelte/commit/a07027f094d8fe6b590298ef307773f125186733))
- **tree-view:** support Home and End keys for focus navigation ([8f1c11d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8f1c11dd59ebc85d2715c5035d84fa23157763f6))
- **tree-view:** tree walker handles non-Element nodes and skips hidden rows ([0b0e5e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b0e5e3138565333b7d1a5d57b7fd38b36be7c5f))
- **ui-shell:** `Header` preserves user-toggled side nav across breakpoints (#3013) ([c66efd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/c66efd1b05e1bb873a22b7b3fa86ba9a94b55d8d))
- **ui-shell:** `HeaderAction` allows content overflow and uses correct color scheme ([30b0b9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/30b0b9ef5346221420c3190e693e96b4880955ff))
- **ui-shell:** `HeaderActionLink` uses correct focus outline color (#3154) ([ed746b2](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed746b2d896e03068b15e97d92e6431c83a28119))
- **ui-shell:** `HeaderNav` does not forward `aria-label` to menu bar (#3028) ([cccc4a9](https://github.com/carbon-design-system/carbon-components-svelte/commit/cccc4a98edd179f5f98a9c48eac97b0909bd9391))
- **ui-shell:** `HeaderShell` uses unique IDs (#3010) ([ab7991f](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab7991f7a8fb64e82194e4cda9d9915422269b9b))
- **ui-shell:** `SideNav` locks body scroll when used with modal ([ddc76aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/ddc76aa6e32fc10d4f124e8cf7cb5df65a491d5f))
- **ui-shell:** guard `ref` access in window click handlers (#3012) ([00a52a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/00a52a83579da31304da262477ff083951c52f0f))
- avoid literal false tokens in composed class attributes (#2960) ([0979800](https://github.com/carbon-design-system/carbon-components-svelte/commit/09798001c8fd90fda71ff939679e3e60d69c42a4))
- drop literal "undefined" token from interpolated class strings (#2992) ([802d8e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/802d8e26ffaa435517db1b0ac70f786cf5c69471))

### Performance

- **combo-box:** drop per-keystroke index Map for `findIndex` (#3088) ([c70ed77](https://github.com/carbon-design-system/carbon-components-svelte/commit/c70ed77651078a6413a5e7afcc1b7cc71999897f))
- **combo-box:** remove dead code for single-filtered-item (#2934) ([50e3f08](https://github.com/carbon-design-system/carbon-components-svelte/commit/50e3f08c4f3c49a7a905dfaa329804fba5580f2e))
- **combo-box:** remove no-op `highlightedId` writes (#2915) ([d606f87](https://github.com/carbon-design-system/carbon-components-svelte/commit/d606f87745125af03906e93a68fe7b5f1f538efa))
- **data-table:** remove imperative `refSelectAll.checked` (#2937) ([981d2d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/981d2d51723d2a6b3e1391177c571434d529d1ea))
- **data-table:** remove unused `expandedRowsHeight` reactive (#2942) ([e5c66dc](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5c66dc78b0edf75a072dae4698ad3b7595fd08f))
- **date-picker:** skip redundant `flatpickr` updates on reactive ticks (#2892) ([80375a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/80375a7a2a1b27f95c0f7a2274df4b7226be304a))
- **dropdown:** drop selected index map (#3090) ([06c5af2](https://github.com/carbon-design-system/carbon-components-svelte/commit/06c5af28d16cfd099ddb0386b717979fddef6187))
- **dropdown:** use `itemIndexById` for virtualized scroll-to-selected (#2935) ([2ceea55](https://github.com/carbon-design-system/carbon-components-svelte/commit/2ceea5535782f99ef215a5ab985279e7cd5f7c87))
- **multi-select:** drop per-keystroke index Map for `findIndex` (#3089) ([6ee97fa](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ee97fab23b5e097ec5388b4dcac1244129f387e))
- **toolbar-search:** avoid refiltering on unrelated updates (#3024) ([966ea54](https://github.com/carbon-design-system/carbon-components-svelte/commit/966ea5476e85851587d8cc8c8c122a12544504f3))
- **tree-view-node:** hide collapsed nodes via CSS (#3007) ([e5c2910](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5c2910f06a5ca960c76b4627a1219ff39cba70a))

### [0.107.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.107.0...v0.107.1) (2026-05-02)

### Bug Fixes

- **date-picker:** support portal menu inside native `dialog` ([3fb3948](https://github.com/carbon-design-system/carbon-components-svelte/commit/3fb3948a7ca3e8499a908ca79f70b464db83a3df)), closes [#2881](https://github.com/carbon-design-system/carbon-components-svelte/issues/2881)
- **floating-portal:** auto-target accounts for native `popover` ([741ccd4](https://github.com/carbon-design-system/carbon-components-svelte/commit/741ccd4950bdaf8e3b1705ce197419d2d797e381)), closes [#2882](https://github.com/carbon-design-system/carbon-components-svelte/issues/2882)

### [0.107.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.106.2...v0.107.0) (2026-04-25)

### Features

- **floating-portal:** add `target` prop ([b4b0b50](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4b0b5054ef2d0f74d153ae6b3b205d2521e2372))
- **floating-portal:** auto-detect native `dialog` as target ([4e438df](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e438df7ac0c7d3dfff8f122b6911d747bec5965)), closes [#2873](https://github.com/carbon-design-system/carbon-components-svelte/issues/2873)
- **portal:** add `target` prop ([029f65e](https://github.com/carbon-design-system/carbon-components-svelte/commit/029f65e08ef0dd970becf9dc174a9ae3773b524f))

### Bug Fixes

- **checkbox-group:** avoid dispatching "change" event twice ([bab81b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/bab81b4f180a66a19aaa28f95937ebaae08a400a))
- **checkbox-group:** prevent dispatching initial "change" event in Svelte 5 ([4fe17ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/4fe17ef594c52d291af7e2c42616cd16307ef88f)), closes [#2878](https://github.com/carbon-design-system/carbon-components-svelte/issues/2878)
- **content-switcher:** prevent dispatching initial "change" event in Svelte 5 ([4f8066c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f8066cf2a40869ac52733c909da51499a807147)), closes [#2878](https://github.com/carbon-design-system/carbon-components-svelte/issues/2878)
- **radio-button-group:** prevent dispatching initial "change" event in Svelte 5 ([fb3b758](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb3b758919c6ffe5c876021d45df893a08c72db7)), closes [#2879](https://github.com/carbon-design-system/carbon-components-svelte/issues/2879)

### [0.106.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.106.1...v0.106.2) (2026-04-20)

### Bug Fixes

- **select:** prevent dispatching initial "update" event in Svelte 5 (#2872) ([5e8afc1](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e8afc1a5c23473e701f8c2bccf7556c85bb1066)), closes [#2871](https://github.com/carbon-design-system/carbon-components-svelte/issues/2871)

### [0.106.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.106.0...v0.106.1) (2026-04-16)

### Bug Fixes

- **data-table-skeleton:** do not require `DataTableHeader` key/empty/value properties (#2870) ([482feac](https://github.com/carbon-design-system/carbon-components-svelte/commit/482feac23bf2db92ace6f802d28bc4c72a4f6c76)), closes [#2869](https://github.com/carbon-design-system/carbon-components-svelte/issues/2869)
- **types:** `tabindex` type allows number or string ([8f2180d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8f2180d560996f99d577de9f8904781d1cf092b2))

### [0.106.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.105.1...v0.106.0) (2026-04-08)

### Features

- **combo-box:** add `openOnClear` ([7fbfc35](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fbfc35e45247ecc49a788dea85f2343e12ff37c))
- **combo-box:** support auto-highlighting the first match ([cbcf9bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbcf9bda057e4c8f3b84455118e914f5a79fde77))
- **combo-box:** typeahead supports custom `shouldFilterItem` ([06c6d57](https://github.com/carbon-design-system/carbon-components-svelte/commit/06c6d5744c21b5a2eb30b2f0fc2f03982fd64c99))
- **data-table:** add top-level `sort` prop ([2bd1e14](https://github.com/carbon-design-system/carbon-components-svelte/commit/2bd1e14a994423a17448d9ea3ea2c959094da171))
- **data-table:** dispatch `sort` event ([ce9b0b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ce9b0b65d084e6e47a66d8a4bd091b78d814398c))
- **dropdown:** `selectedId` is optional ([26567e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/26567e9db4bba75c0f0f77a75fdc23f412c2cbec))
- **tag:** support large size ([20274c5](https://github.com/carbon-design-system/carbon-components-svelte/commit/20274c575f7a3d29a0f2fb128a603015df47ca35))
- **theme:** support rendering as a `Dropdown` ([7d78437](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d784379fb6493e3d8b5b8f85793664ed03189ac))
- **tree-view:** support `multiselect` ([378d1e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/378d1e60b8b64a6cc112652caaabca56b2b0c596))
- **tree-view:** support links ([8ee8f5d](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ee8f5d3a610c606460ce8f077751045379d5e5c))
- **ui-shell:** support classic theme ([822ce33](https://github.com/carbon-design-system/carbon-components-svelte/commit/822ce33a279ebc2fba66e234c9ac37bf663a4275)), closes [#2836](https://github.com/carbon-design-system/carbon-components-svelte/issues/2836)

### Bug Fixes

- **combo-box:** add missing "lg" size mapping ([f4cb46c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4cb46c1206e474ff881f8efd3fff88452f5af15))
- **combo-box:** do not auto-select partial match when pressing "Enter" ([7cbb63b](https://github.com/carbon-design-system/carbon-components-svelte/commit/7cbb63bcb1b7b800ad7079a7d5f42be84cdedb69))
- **combo-box:** do not trap focus when clicking outside element ([42984b9](https://github.com/carbon-design-system/carbon-components-svelte/commit/42984b944d6714e3d25c232772779c44236ec00a))
- **combo-box:** prevent infinite loop when all items are disabled ([d9289f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/d9289f2978cdd4eeda6781be6632b2f42a0d09b9))
- **dropdown:** button uses `combobox` role, apply missing ARIA attributes ([62c4be5](https://github.com/carbon-design-system/carbon-components-svelte/commit/62c4be5302f561f57e6e675a99d850b10e40b27a))
- **dropdown:** do not spread `translateWithId` to raw `button` element ([96e7af2](https://github.com/carbon-design-system/carbon-components-svelte/commit/96e7af297b38f10bba28cf7058d9d8ad5647a860))
- **dropdown:** prevent infinite loop when all items are disabled ([f58fc9c](https://github.com/carbon-design-system/carbon-components-svelte/commit/f58fc9c5dd27b159c532616c3ba03e8e5667a82c))
- **dropdown:** selected item has checkmark icon ([93ebb19](https://github.com/carbon-design-system/carbon-components-svelte/commit/93ebb1978ca8538fb16d37f2a57c4b5193e16549))
- **dropdown:** use `labelText` as aria-label fallback ([5a53787](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a537877675692af60662bd0835b2ec27fe29919))
- **list-box:** add missing "lg" size mapping ([54e6520](https://github.com/carbon-design-system/carbon-components-svelte/commit/54e652093c3ccb9a5a9acb89e7ae5442cc55385b))
- **multi-select:** `sortItem` comparator returns a number, not `Item` ([1a04817](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a0481752ca9237728338ea5f1cda8c1237a3f23))
- **multi-select:** Backspace/Delete clears selection ([3ffbb31](https://github.com/carbon-design-system/carbon-components-svelte/commit/3ffbb311343864fb7c5f0c078ab89ce991334d34))
- **multi-select:** fix typo in `size` prop description ([65ea6c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/65ea6c361341f83e334214e8feea37d8ebd8c052))
- **multi-select:** invalid/warn, filterable variant should only render one icon ([dcf0c7e](https://github.com/carbon-design-system/carbon-components-svelte/commit/dcf0c7e3d5f4838d6bff1851ace1b331a53a9986))
- **multi-select:** narrow `itemToString` return type ([57fddc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/57fddc985e118051bc40d20e6ed1cfcd9116acc4))
- **multi-select:** prevent infinite loop when all items are disabled ([edfa849](https://github.com/carbon-design-system/carbon-components-svelte/commit/edfa8499530c9dcebc149218b6ffa55d583bf571))
- **number-input:** remove `pattern` for number type input ([853a6c3](https://github.com/carbon-design-system/carbon-components-svelte/commit/853a6c394183a22256940da406957253a9555ec9))
- **number-input:** text mode should also apply min/max/step attributes to `input` ([5a889f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/5a889f98b27d74119511783a16ea4506b2d64da3))
- **tree-view:** `expandNodes` should expand all by default ([b445c59](https://github.com/carbon-design-system/carbon-components-svelte/commit/b445c59c23033da4478f1ba3e071594a2f894e25))
- **tree-view:** escape node ID when using `querySelector` for focusing ([f8fce52](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8fce52a39d24e1a5b420bdf7e0aa78a4aa321d9))

### Performance

- **combo-box:** use Set/Map for O(1) lookups ([88f5c3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/88f5c3ca0b1f30ab2ceb6ed2beb7f6d40270d24c))
- **data-table:** avoid virtualized scroll set-up after any reactive update ([02b619c](https://github.com/carbon-design-system/carbon-components-svelte/commit/02b619cc7687bc950fef8d75934ce2e6c4354341))
- **data-table:** guard rows assignment with reference check ([f7ae1c6](https://github.com/carbon-design-system/carbon-components-svelte/commit/f7ae1c6b6f6851a0fccbdeb98ee6049d0ef8cc30))
- **data-table:** rebuild `tableCellsByRowId` for changed headers only ([7adacb3](https://github.com/carbon-design-system/carbon-components-svelte/commit/7adacb347f72a68997ad7a7131375632bcf1307e))
- **data-table:** remove unused `thKeys` computation ([ff2cae4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff2cae419b540d94d3ed1f026285f3bf9b1cbeaa))
- **dropdown:** use Set/Map for O(1) lookups ([5f1bc01](https://github.com/carbon-design-system/carbon-components-svelte/commit/5f1bc014af5572a5dbd7a865c56b2ae29ac0cc30))
- **multi-select:** avoid double re-sort for `selectionFeedback="top"` ([f1ba47f](https://github.com/carbon-design-system/carbon-components-svelte/commit/f1ba47fcd6af7d2cc65d731936aca98fe08577c8))
- **multi-select:** optimize `isSelectAll` logic ([f6250b0](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6250b00deefb799ca4343f12b788d64cae6ee16))
- **multi-select:** use Set/Map for O(1) lookups ([5ce7d39](https://github.com/carbon-design-system/carbon-components-svelte/commit/5ce7d3942752aef0fdda16dd029223ce213114d7))
- **number-input:** cache `Intl.NumberFormat` locale usage ([e98bbd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/e98bbd5178e824a0df2e9f87492acdb20b21f807))
- **tree-view:** remove unused tree walker reactive initialization ([b115ce2](https://github.com/carbon-design-system/carbon-components-svelte/commit/b115ce25d00bc34c1628243557f3874834868772))

### [0.105.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.105.0...v0.105.1) (2026-04-01)

### Bug Fixes

- **composed-modal:** use mouse events for outside click ([7104ac4](https://github.com/carbon-design-system/carbon-components-svelte/commit/7104ac4957539ede9ed4d02784bf4c8513ea249e)), closes [#2805](https://github.com/carbon-design-system/carbon-components-svelte/issues/2805)
- **modal:** use mouse events for outside click ([3a8fa07](https://github.com/carbon-design-system/carbon-components-svelte/commit/3a8fa07ff7ddca1100d2a6c8e52cbe3deb72a974)), closes [#2805](https://github.com/carbon-design-system/carbon-components-svelte/issues/2805)

### [0.105.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.104.0...v0.105.0) (2026-03-28)

### Features

- **ui-shell:** support theming ([83af86b](https://github.com/carbon-design-system/carbon-components-svelte/commit/83af86b918402e8cd2f31a38faee233eca05afa3)), closes [#2457](https://github.com/carbon-design-system/carbon-components-svelte/issues/2457)

### Bug Fixes

- **ui-shell:** `HeaderSearch` does not render clear button if inactive ([089fb86](https://github.com/carbon-design-system/carbon-components-svelte/commit/089fb86570b9f17ecbe3bcefebec099f4c857649))

### [0.104.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.103.0...v0.104.0) (2026-03-28)

### Features

- **code-snippet:** portal tooltip inside modal context ([7821456](https://github.com/carbon-design-system/carbon-components-svelte/commit/7821456430d28dc71dd5f2b352589f8e0f72be25)), closes [#386](https://github.com/carbon-design-system/carbon-components-svelte/issues/386)
- **combo-box:** add `selectTextOnFocus` prop ([e0554a0](https://github.com/carbon-design-system/carbon-components-svelte/commit/e0554a04fbe275cf56917387bf113bdccccfaf7d))
- **content-switcher:** add `selectionMode` prop ([ef0fb0a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ef0fb0a27d147e152c08b272f6f35d2d585bd07d))
- **context-menu:** `e.preventDefault()` prevents menu from closing ([66d08bc](https://github.com/carbon-design-system/carbon-components-svelte/commit/66d08bcd1eb7f613157f0da3997e4ec5e25e4cc9))
- **copy-button:** portal tooltip inside modal context ([10f109f](https://github.com/carbon-design-system/carbon-components-svelte/commit/10f109f83000fbad016a67539705b26b6742acbc))
- **file-uploader:** `iconDescription` passes back file metadata ([80730e6](https://github.com/carbon-design-system/carbon-components-svelte/commit/80730e67effa36f5ca00216c22088dc8e0091da8))
- **file-uploader:** `iconDescription` uses better defaults ([252d536](https://github.com/carbon-design-system/carbon-components-svelte/commit/252d5363bb3409bef4a7032afadb6caecd0d50e0))
- **file-uploader:** add `orderFiles` prop ([70a939a](https://github.com/carbon-design-system/carbon-components-svelte/commit/70a939a050a339594a0b75101899790bd3369e33)), closes [#2775](https://github.com/carbon-design-system/carbon-components-svelte/issues/2775)
- **file-uploader:** add `preventDuplicates` prop ([b867814](https://github.com/carbon-design-system/carbon-components-svelte/commit/b8678148956cc842aa7d7a35956f6d4d8f9af83b))
- **file-uploader:** dispatch clear and change events when clearing files ([6ca7acc](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ca7acc278e591808c77d1d43f5bb5ca1ff5f88a))
- **file-uploader:** dispatch rejected event if file exceeds `maxFileSize` ([f4a9cc6](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4a9cc618dedee92d3ba24593c26197113e2148d))
- **floating-portal:** add `intrinsicAlign` prop ([6731628](https://github.com/carbon-design-system/carbon-components-svelte/commit/673162838927531a3c2a9805d4e314d6e781e3ad))
- **floating-portal:** support `intrinsicWidth` prop ([d98fddc](https://github.com/carbon-design-system/carbon-components-svelte/commit/d98fddc0bf5cbbebecfc715d94a1ebc8031c8ec0))
- **floating-portal:** support left/right directions, gap props ([01d07ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/01d07acb3c092c5c3e0e7a845157ead67eb0079a))
- **multi-select:** support `isSelectAll` item option ([a97b2b7](https://github.com/carbon-design-system/carbon-components-svelte/commit/a97b2b7ddfc4f0e128faa43e655a6fb3b58f9c71))
- **skeleton-icon:** add `SkeletonIcon` component ([d91ed6a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d91ed6aeac4c715d82c0924c7af8e5aa328ba6b2))
- **skeleton-placeholder:** add size/width/height props ([4f364ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f364cee9096c4e77bee0c0be8371d0692f94deb))
- **tag:** add `SelectableTag` ([9314882](https://github.com/carbon-design-system/carbon-components-svelte/commit/931488293e086662827834c04f46547b1c9bc21a)), closes [#2763](https://github.com/carbon-design-system/carbon-components-svelte/issues/2763)
- **theme:** set `color-scheme` on root element ([0c69e41](https://github.com/carbon-design-system/carbon-components-svelte/commit/0c69e41555133c754bc39945e126ca6823cf1f7b))
- **tooltip-definition:** add `clickToOpen` prop ([4960a6c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4960a6c1287cb34d40f377c42efc5ba8e2094fe3)), closes [#2761](https://github.com/carbon-design-system/carbon-components-svelte/issues/2761)
- **tooltip-definition:** add `enterDelayMs` and `leaveDelayMs` props ([454e392](https://github.com/carbon-design-system/carbon-components-svelte/commit/454e39260ef7aa6783e50c2ed7020e3fed6ea412))
- **tooltip-definition:** portal tooltip inside modal context ([05b7293](https://github.com/carbon-design-system/carbon-components-svelte/commit/05b72939ed9364a2cb9ba11b74658c0c1399f37b))
- **tooltip-icon:** add `enterDelayMs` and `leaveDelayMs` props ([5678ce3](https://github.com/carbon-design-system/carbon-components-svelte/commit/5678ce3d27f554a8369b182f59f3fca84d370c0f))
- **tooltip-icon:** add `open` prop and open/close events ([33585f9](https://github.com/carbon-design-system/carbon-components-svelte/commit/33585f979cd07ac7358b1ba2afbf8952f500cf16))
- **tooltip-icon:** portal tooltip inside modal context ([db287f5](https://github.com/carbon-design-system/carbon-components-svelte/commit/db287f598875f863f9e885e74c9b6de1c63e7f80))
- **tooltip:** portal tooltip inside modal context ([71c153d](https://github.com/carbon-design-system/carbon-components-svelte/commit/71c153dd94e9664e41586fc76c7cc8fb18c1ea5c))

### Bug Fixes

- **context-menu:** auto-indent option with icon ([4a1f32c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4a1f32c87583cb00b378600248bbb33ae3b74c5a))
- **data-table:** custom sort accounts for sort direction ([#2797](https://github.com/carbon-design-system/carbon-components-svelte/issues/2797)) ([388709a](https://github.com/carbon-design-system/carbon-components-svelte/commit/388709a3604ce223942773c75b5f42b1ba6c2ea5))
- **file-uploader:** use stable file IDs ([ea2608f](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea2608f604b7a9eb42a94dc16ab9aa6d4351e110))
- **inline-notification:** title uses `strong` element for emphasis ([#2750](https://github.com/carbon-design-system/carbon-components-svelte/issues/2750)) ([5385c00](https://github.com/carbon-design-system/carbon-components-svelte/commit/5385c006101cd0203521fdcb9ed9ffcbb932b03e))
- **password-input:** portal tooltip inside modal context ([3930789](https://github.com/carbon-design-system/carbon-components-svelte/commit/39307898d4c40a220bac6da73a78c29bc8b529ac)), closes [#545](https://github.com/carbon-design-system/carbon-components-svelte/issues/545) [#1603](https://github.com/carbon-design-system/carbon-components-svelte/issues/1603)
- **toolbar-search:** remove redundant `<any>` from Row generics ([6657a61](https://github.com/carbon-design-system/carbon-components-svelte/commit/6657a6103b4086949d1a54b1f1591bcc54f7c4a7))
- **tooltip-icon:** only one tooltip is visible at a time ([d93c795](https://github.com/carbon-design-system/carbon-components-svelte/commit/d93c7951e1daec70141c5bbe4cd916fc48eaa3d6))
- **types:** remove unnecessary `[@template](https://github.com/template)` JSDoc type ([bed6a59](https://github.com/carbon-design-system/carbon-components-svelte/commit/bed6a597355649d688784f7f4bbd24e83801ae5b))
- **ui-shell:** ensure `HeaderAction` button styles match spec ([309d62e](https://github.com/carbon-design-system/carbon-components-svelte/commit/309d62ee2f1e48849d58e37fb56a4277ec8a85ed))
- **ui-shell:** ensure search close button hover style is preserved ([f8d1df1](https://github.com/carbon-design-system/carbon-components-svelte/commit/f8d1df1bad5b313c465b6a76be592109a172974f))

### [0.103.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.102.0...v0.103.0) (2026-03-09)

### Features

- **button:** `icon` is generic ([a7e7df7](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7e7df73caf3503b2e3f1580d681507494164646))
- **checkbox:** `value` is generic ([478bbc3](https://github.com/carbon-design-system/carbon-components-svelte/commit/478bbc33f72fc65b85de97d55c0d8edbfa9f1307))
- **contained-list:** `icon` is generic ([d8c4e6d](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8c4e6d29a88c5a3a32f7c8de6a96ece07eac6d4))
- **context-menu-option:** `icon` is generic ([fb55602](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb55602cf50a6d4e48c2ee9d3c706640ac9ebd7a))
- **file-uploader-button:** `icon` is generic ([6d23ae9](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d23ae94f4f6a30880642077d40834f5da6dd3ac))
- **link:** `icon` is generic ([519fe6f](https://github.com/carbon-design-system/carbon-components-svelte/commit/519fe6f33972dce7c44b7d3c8e09cfb2986bd800))
- **local-storage:** `value` is generic ([f6c5402](https://github.com/carbon-design-system/carbon-components-svelte/commit/f6c5402fa8f7144f5b769bb46b5ee1562db75e27))
- **modal-footer:** `primaryButtonIcon` is generic ([ea83bd6](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea83bd6d60dd099c7e5d7198c577caf676609017))
- **modal:** `primaryButtonIcon` is generic ([98029d6](https://github.com/carbon-design-system/carbon-components-svelte/commit/98029d694713d70999ef8703f23e477b8d13c341))
- **notification-button:** `icon` is generic ([a8bb771](https://github.com/carbon-design-system/carbon-components-svelte/commit/a8bb771f0299a9ae618fafbb1afd2a8ba4ca6731))
- **overflow-menu:** `icon` is generic ([3be481f](https://github.com/carbon-design-system/carbon-components-svelte/commit/3be481f8446ecdaa83e1de1a21b8dd447c6a5711))
- **search:** `icon` is generic ([09bace4](https://github.com/carbon-design-system/carbon-components-svelte/commit/09bace4f48b9a292052a5087f288139900bea257))
- **search:** `value` is generic ([72564ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/72564ad3a6309c2cd4f1df25447a58b8317fe5e4))
- **session-storage:** `value` is generic ([cab5277](https://github.com/carbon-design-system/carbon-components-svelte/commit/cab52775b91ad55615e67e0ce2da987e37ddb13c))
- **tab:** `icon` is generic ([cf3bf3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/cf3bf3c45a67e4bca357995b362da365033ce275))
- **tabs:** `Tab` supports `icon` prop ([c520ce6](https://github.com/carbon-design-system/carbon-components-svelte/commit/c520ce6dd204a49edddb3c567d782466f59e602b)), closes [#2729](https://github.com/carbon-design-system/carbon-components-svelte/issues/2729)
- **tabs:** container type supports `secondaryLabel` ([1c52431](https://github.com/carbon-design-system/carbon-components-svelte/commit/1c52431060e5e8b1ba4e1bb944a7ab636029c3e1)), closes [#2725](https://github.com/carbon-design-system/carbon-components-svelte/issues/2725)
- **tabs:** container type supports icons ([b4e53fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4e53fcd84bf5b24c13e40593a04c95807878122)), closes [#2724](https://github.com/carbon-design-system/carbon-components-svelte/issues/2724)
- **tabs:** support `fullWidth` ([7bf42f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/7bf42f7f9a76a98e303e9579568e154cf2dc4ae2)), closes [#2722](https://github.com/carbon-design-system/carbon-components-svelte/issues/2722)
- **tag:** `icon` is generic ([a76bc23](https://github.com/carbon-design-system/carbon-components-svelte/commit/a76bc2379534f5317e7db79aa4c1d210796ec0ff))
- **theme:** `tokens` is generic ([dbfe108](https://github.com/carbon-design-system/carbon-components-svelte/commit/dbfe1088f3a0da84116febd929802cb165f1a0f7))
- **toolbar-batch-actions:** `id` is generic ([ef743b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ef743b4b114bf82acd3e300c65b93b755ce697d1))
- **tooltip-icon:** `icon` is generic ([a1f8f74](https://github.com/carbon-design-system/carbon-components-svelte/commit/a1f8f74ec6a9ca72d0a79e4eea5ce6a8a55b5192))
- **tooltip:** `icon` is generic ([1e01218](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e01218c5528506e9a74218cc6e2da2927c2d6b5))
- **tree-view-node:** `icon` is generic ([cfd460a](https://github.com/carbon-design-system/carbon-components-svelte/commit/cfd460a79b5700a56e3bcf48d071e83a30f6b52a))
- **ui-shell:** `icon` is generic ([22f1d24](https://github.com/carbon-design-system/carbon-components-svelte/commit/22f1d248e6f2320eaf44b9e03ed9b6b8749d02b3))

### Bug Fixes

- **breakpoint:** guard `breakpointObserver` find result and derived callbacks ([0478240](https://github.com/carbon-design-system/carbon-components-svelte/commit/0478240dda88bbe8a75783df10e748d65e7b979d))
- **combo-box:** use `labelText` as aria-label fallback ([b997f69](https://github.com/carbon-design-system/carbon-components-svelte/commit/b997f6936f42a8bfb3d9df1bddd26b5fd524176b)), closes [#2715](https://github.com/carbon-design-system/carbon-components-svelte/issues/2715)
- **data-table:** guard `resolvePath` pathCache.delete and segments ([aad08b6](https://github.com/carbon-design-system/carbon-components-svelte/commit/aad08b6f42c5e96c8e99bfce6ceeb9a60d6e6190))
- **date-picker:** add null safety check for `createCalendar`, guard `RangePlugin` use ([d4dacdc](https://github.com/carbon-design-system/carbon-components-svelte/commit/d4dacdceff0a781ac53b65c2cedfe37e6e165a62))
- **tabs:** container type disabled tab should not apply border on hover ([bdfae5a](https://github.com/carbon-design-system/carbon-components-svelte/commit/bdfae5a3d34fc464e5ea6637995284256bcc3654))
- **tabs:** container type has background color for panel ([7c2be21](https://github.com/carbon-design-system/carbon-components-svelte/commit/7c2be21083216710dbb0c2f4910866a66f873961)), closes [#2723](https://github.com/carbon-design-system/carbon-components-svelte/issues/2723)
- **tabs:** container type should be auto-width by default ([0713704](https://github.com/carbon-design-system/carbon-components-svelte/commit/07137049110646b385f435915feffd798fd584e9)), closes [#2739](https://github.com/carbon-design-system/carbon-components-svelte/issues/2739)
- **truncate:** guard update() options in truncate action ([98ea6d5](https://github.com/carbon-design-system/carbon-components-svelte/commit/98ea6d58963c889c4404f9a88526bb96bc88ced2))
- **ui-shell:** allow `SideNav` overlay to show for custom expansion breakpoint ([84eb3bd](https://github.com/carbon-design-system/carbon-components-svelte/commit/84eb3bd54f8d35c5dd16789bcdee775381967b44)), closes [#770](https://github.com/carbon-design-system/carbon-components-svelte/issues/770)

## [0.102.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.4...v0.102.0) (2026-03-07)

### ⚠ BREAKING CHANGES

- **data-table:** rename `expanded-row` slot to `expandedRow` for Svelte 5 snippet support

### Features

- **data-table:** add `sortAlways` prop ([44a85ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/44a85eaf98ddb5338a4b077813b72e6c69e738ec)), closes [#2697](https://github.com/carbon-design-system/carbon-components-svelte/issues/2697)
- **data-table:** allow custom expand icon ([65349c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/65349c4968abf3285a878acc0a34ed33bf6acb51)), closes [#2696](https://github.com/carbon-design-system/carbon-components-svelte/issues/2696)
- **session-storage:** add `SessionStorage` component ([d63670a](https://github.com/carbon-design-system/carbon-components-svelte/commit/d63670a495707288eea17767c34365772f64577c)), closes [#2695](https://github.com/carbon-design-system/carbon-components-svelte/issues/2695)

### Bug Fixes

- **tag:** filterable tag supports `click` event on tag body ([aaf15a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/aaf15a125f5c103b9e1e0058179b062eb987699c)), closes [#2694](https://github.com/carbon-design-system/carbon-components-svelte/issues/2694)
- **tree-view:** use correct leaf depth to restore active node style ([7fda0f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fda0f71ddc6ef2464b62f99dedc71961651dc8d))

### [0.101.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.3...v0.101.4) (2026-02-26)

### Bug Fixes

- **ui-shell:** remove incorrect role="menu" from `SideNavMenu` ([#2704](https://github.com/carbon-design-system/carbon-components-svelte/issues/2704)) ([6d6cd02](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d6cd0210c985675f06f85e2cf4936d010bb787b))

### Performance

- **date-picker:** hoist regex to module scope in `DatePickerInput` ([#2705](https://github.com/carbon-design-system/carbon-components-svelte/issues/2705)) ([e30d3afe](https://github.com/carbon-design-system/carbon-components-svelte/commit/e30d3afef86142e43913e94caf8344e9b42e7c65))
- **data-table:** extract and hoist row click ignore regex to `shouldIgnoreRowClick` utility ([#2705](https://github.com/carbon-design-system/carbon-components-svelte/issues/2705)) ([5b832f5a](https://github.com/carbon-design-system/carbon-components-svelte/commit/5b832f5ad6fe003c7cb31de0dad99e3c594adf63))

### [0.101.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.2...v0.101.3) (2026-02-25)

### Bug Fixes

- **ui-shell:** fixed `SideNav` should not render hamburger menu or unset left margin ([4f2db4b](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f2db4bfd7bf6b5199c59562dcde9cc0c61dd697)), closes [#2701](https://github.com/carbon-design-system/carbon-components-svelte/issues/2701)

### [0.101.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.1...v0.101.2) (2026-02-23)

### Bug Fixes

- **dropdown:** menu should close if `portalMenu` is true ([09a4a91](https://github.com/carbon-design-system/carbon-components-svelte/commit/09a4a91aeb9ee01b88e94a1cd5454ebb3b96ed02)), closes [#2699](https://github.com/carbon-design-system/carbon-components-svelte/issues/2699)

### [0.101.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.101.0...v0.101.1) (2026-02-21)

### Bug Fixes

- **composed-modal:** auto-focus first input for transactional dialogs ([1e4abac](https://github.com/carbon-design-system/carbon-components-svelte/commit/1e4abac06187cddc8befe753437ae2b727002fe7)), closes [#2671](https://github.com/carbon-design-system/carbon-components-svelte/issues/2671)
- **composed-modal:** auto-focus secondary button for danger modals ([445c343](https://github.com/carbon-design-system/carbon-components-svelte/commit/445c3437d2a2ee1f8b8a852cab6fd4cab13fd0bf))
- **date-picker:** don't escape hyphens in derived input pattern ([7476b77](https://github.com/carbon-design-system/carbon-components-svelte/commit/7476b7707d74496cf6d37c9b4d0558f299101845)), closes [#2689](https://github.com/carbon-design-system/carbon-components-svelte/issues/2689)
- **modal:** auto-focus first input for transactional dialogs ([bdc7728](https://github.com/carbon-design-system/carbon-components-svelte/commit/bdc7728a77e344e10bd11c43462fd84e930a7061)), closes [#2671](https://github.com/carbon-design-system/carbon-components-svelte/issues/2671)
- **modal:** auto-focus secondary button for danger modals ([0bd8148](https://github.com/carbon-design-system/carbon-components-svelte/commit/0bd8148188c6721120e45b3a269184de759816ab))
- **tooltip:** show tooltip on hover ([0f148fc](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f148fc3623cdd62741a69de4e6346044351e964)), closes [#2687](https://github.com/carbon-design-system/carbon-components-svelte/issues/2687)
- **types:** replace `any` with inferred generics and `unknown` ([d30aec2](https://github.com/carbon-design-system/carbon-components-svelte/commit/d30aec2001aa451f2ea043ebfcfab96e851e23bc))

## [0.101.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.100.0...v0.101.0) (2026-02-16)

### ⚠ BREAKING CHANGES

- apply `carbon:` prefix to contexts

### Features

- **checkbox-group:** add `CheckboxGroup` ([935b4de](https://github.com/carbon-design-system/carbon-components-svelte/commit/935b4de2aa84771c744f53a0fe3507da67cf908b))
- **combo-box:** add `portalMenu` prop ([ee0c452](https://github.com/carbon-design-system/carbon-components-svelte/commit/ee0c4528886a8d1267b47771bf3b1b1fd0a2f269)), closes [#2632](https://github.com/carbon-design-system/carbon-components-svelte/issues/2632)
- **data-table:** support virtualized rows ([c187b72](https://github.com/carbon-design-system/carbon-components-svelte/commit/c187b7295a546337f7564fe9c93771ca651f3a74)), closes [#1192](https://github.com/carbon-design-system/carbon-components-svelte/issues/1192)
- **date-picker:** add `portalMenu` prop ([6d11f3e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d11f3ec2a6cef2e525a2c9ea158d14222d70e9a)), closes [#2632](https://github.com/carbon-design-system/carbon-components-svelte/issues/2632)
- **dropdown:** add `portalMenu` prop ([43b7b8a](https://github.com/carbon-design-system/carbon-components-svelte/commit/43b7b8abb920b5fbb403de24dca21c10d91f7e92)), closes [#2142](https://github.com/carbon-design-system/carbon-components-svelte/issues/2142)
- **expandable-tile:** add `hasInteractiveContent` prop ([4e345f8](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e345f8d06ce95a331567afde7f8ff3023b32a54))
- **floating-portal:** add `FloatingPortal` ([532066a](https://github.com/carbon-design-system/carbon-components-svelte/commit/532066a448a0ffa2ba89497c6d96327a24d8188e))
- **list-box-menu:** add portal support ([8d425c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/8d425c46e6522f49050aca3b59ffb7c1397842f6))
- **multi-select:** add `portalMenu` prop ([e099432](https://github.com/carbon-design-system/carbon-components-svelte/commit/e099432c8dce9ae8402ef6035d60ada2b746acf5))
- **overflow-menu:** add `portalMenu` prop ([20dfaea](https://github.com/carbon-design-system/carbon-components-svelte/commit/20dfaea72aefb997ee31bb2d0843fbe2fcb82b35))
- **portal:** add `ref` prop for element access ([48d1676](https://github.com/carbon-design-system/carbon-components-svelte/commit/48d1676f589c4fc77ef213101374e53fa26018ba))
- **radio-button-group:** `selected` value is generic ([86891eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/86891eba4839d8fee12dfe7fe20385f1c8cfc4b1))
- **radio-button:** `selected` value is generic ([128ee38](https://github.com/carbon-design-system/carbon-components-svelte/commit/128ee388ec8fd3bad0a14d4bc2242c0947e4c5e3))
- **radio-tile:** `value` is generic ([5e942b3](https://github.com/carbon-design-system/carbon-components-svelte/commit/5e942b3f37aa2faab6bc0ba33675543c6f10e18b))
- **select-item:** `value` is generic ([36fd42a](https://github.com/carbon-design-system/carbon-components-svelte/commit/36fd42a8184d77e3092992bd4f74cce6f8e45025))
- **stack:** add `inline` prop for `inline-flex` display ([5710717](https://github.com/carbon-design-system/carbon-components-svelte/commit/5710717afcf94dda75cee09a906ebc9c573f112f))
- **structured-list:** `selected` value is generic ([a725ed8](https://github.com/carbon-design-system/carbon-components-svelte/commit/a725ed8cd55f498d255911e440a54b175c939114))

### Bug Fixes

- **button:** prevent icon-only button tooltip from triggering wrong action ([727573b](https://github.com/carbon-design-system/carbon-components-svelte/commit/727573b5df50a2aa012a70f592a85071eb806c27)), closes [#937](https://github.com/carbon-design-system/carbon-components-svelte/issues/937)
- **composed-modal:** focus primary button if it exists ([6e8a2b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e8a2b1ade683eae2d3f8d4868c9a0af91edb4ca))
- **composed-modal:** return focus to trigger element ([02a6b3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/02a6b3a678db823b83b8212483504ba482fb29ac))
- **date-picker:** derive input pattern from `dateFormat` prop ([a98c85b](https://github.com/carbon-design-system/carbon-components-svelte/commit/a98c85b78acf4a2209d6be6164a7955b680747f9)), closes [#1362](https://github.com/carbon-design-system/carbon-components-svelte/issues/1362)
- **date-picker:** sync "to" input after programmatic range update ([8815b89](https://github.com/carbon-design-system/carbon-components-svelte/commit/8815b8962b44a1cc5bedec454a8a9481e26303d3)), closes [#893](https://github.com/carbon-design-system/carbon-components-svelte/issues/893)
- **date-picker:** use correct variable in `calendar.set` loop ([0f2542f](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f2542f65779bb13703565bbe3ea3a22adceccd5))
- **expandable-tile:** prevent height animation on initial load ([38ce08e](https://github.com/carbon-design-system/carbon-components-svelte/commit/38ce08efa4ee28f6f9f6a481d375a5575cedb660))
- **modal:** focus primary button if it exists ([d6b1885](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6b1885df64b12788698f4880a9259d963a72223)), closes [#2671](https://github.com/carbon-design-system/carbon-components-svelte/issues/2671)
- **modal:** return focus to trigger element ([ad7db12](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad7db12b2eaaea5eb0beb1b91a305fc37194544e))
- **overflow-menu:** `OverflowMenuItem` has explicit `type="button"` to prevent form submission ([6df3d81](https://github.com/carbon-design-system/carbon-components-svelte/commit/6df3d819bf076581a3ca15ad19d2c485d75a6c73))
- **portal:** transfer focus to active element ([0389e9a](https://github.com/carbon-design-system/carbon-components-svelte/commit/0389e9af73952f3c8b31205f2f6efd4775067a35))
- **ui-shell:** collapse `SideNavMenu` items when rail is closed ([1669604](https://github.com/carbon-design-system/carbon-components-svelte/commit/1669604a4f810b2cd3c58c2a4aa2a65c2324d46a)), closes [#746](https://github.com/carbon-design-system/carbon-components-svelte/issues/746)
- **ui-shell:** prevent `SideNav` flicker on page load ([5c98c27](https://github.com/carbon-design-system/carbon-components-svelte/commit/5c98c27a838af3d1f50beb4e069d34e0d7a1e397)), closes [#1383](https://github.com/carbon-design-system/carbon-components-svelte/issues/1383)

## [0.100.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.99.3...v0.100.0) (2026-02-13)

### ⚠ BREAKING CHANGES

- **number-input:** blur event is dispatched, not forwarded; access event through `e.detail.event`

### Features

- **data-table:** add `rowClass` prop ([740aad9](https://github.com/carbon-design-system/carbon-components-svelte/commit/740aad927e6511b9eb8cf77a394c91c6a0b0b575))
- **dropdown:** add `labelChildren` slot ([7920fd5](https://github.com/carbon-design-system/carbon-components-svelte/commit/7920fd5d4dd38968b5a763bdf8859891c5c28ac5))
- **number-input:** add `disableWheel` prop ([e651f9b](https://github.com/carbon-design-system/carbon-components-svelte/commit/e651f9bf15564c894463f2aa90f9d6791829628e)), closes [#2609](https://github.com/carbon-design-system/carbon-components-svelte/issues/2609)
- **number-input:** add `stepStartValue` prop ([afdd567](https://github.com/carbon-design-system/carbon-components-svelte/commit/afdd567c6b483f83a54a67c85aa162def895d1cd)), closes [#2610](https://github.com/carbon-design-system/carbon-components-svelte/issues/2610)
- **number-input:** add validation with auto min/max, locale formatting, `validate` prop ([31b29be](https://github.com/carbon-design-system/carbon-components-svelte/commit/31b29bebcd45bfd38ae157812601eb3fe46b51f1)), closes [#2614](https://github.com/carbon-design-system/carbon-components-svelte/issues/2614) [#2615](https://github.com/carbon-design-system/carbon-components-svelte/issues/2615) [#2616](https://github.com/carbon-design-system/carbon-components-svelte/issues/2616)
- **number-input:** dispatch blur, `click:stepper` events with `value` ([ea3135a](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea3135a31ffda929e1fec7ecc438e60791b513ab)), closes [#2611](https://github.com/carbon-design-system/carbon-components-svelte/issues/2611) [#2617](https://github.com/carbon-design-system/carbon-components-svelte/issues/2617) [#2618](https://github.com/carbon-design-system/carbon-components-svelte/issues/2618)
- **pagination:** add `dynamicPageSizes` prop ([b748b0c](https://github.com/carbon-design-system/carbon-components-svelte/commit/b748b0cea9f6e0bbaf231ac558a665c28c637a0c))
- **tooltip-icon:** add `size` prop ([7469b7d](https://github.com/carbon-design-system/carbon-components-svelte/commit/7469b7d86fca4a041e9fe2a892aa582b229bbd66)), closes [#2587](https://github.com/carbon-design-system/carbon-components-svelte/issues/2587)

### [0.99.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.99.2...v0.99.3) (2026-02-03)

### Bug Fixes

- **text-input:** inline variant supports `labelChildren` slot ([78a065f](https://github.com/carbon-design-system/carbon-components-svelte/commit/78a065f492183603dfd5247c3ebb60628194d44e)), closes [#2625](https://github.com/carbon-design-system/carbon-components-svelte/issues/2625)

### [0.99.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.99.1...v0.99.2) (2026-02-02)

### Bug Fixes

- **code-snippet:** allow empty value for `aria-label` ([1f2b40b](https://github.com/carbon-design-system/carbon-components-svelte/commit/1f2b40bbf1a110ef49406ea9687c93d8303ea00b))
- **code-snippet:** type definitions include `$$restProps` ([cba89af](https://github.com/carbon-design-system/carbon-components-svelte/commit/cba89afc490fe5560bfb3aea44fc9b5479e781f5))
- **combo-box:** `virtualConfig.overscan` allows 0 ([dbce40d](https://github.com/carbon-design-system/carbon-components-svelte/commit/dbce40d1580b739810986367f73495d70bbc42f1))
- **combo-box:** allow empty `item.text` and `aria-label` ([3d2447a](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d2447a8b410c1ecd51f784fa61dffe06d3fb2ca))
- **composed-modal:** allow empty value for `aria-label` ([27508e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/27508e76cae4bff55909d7289b2ce4ae9a5ae275))
- **data-table:** allow empty `header.key` and 0 for `header.width` ([86e8cc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/86e8cc09abaf71240cfedde636a3343b066cae28))
- **data-table:** default string sorting is case- and accent-insensitive ([aada03e](https://github.com/carbon-design-system/carbon-components-svelte/commit/aada03e4efbd93aee6a6db3e0dd8a37d87a5fb3b))
- **dropdown:** `virtualConfig.overscan` allows 0 ([e9fef81](https://github.com/carbon-design-system/carbon-components-svelte/commit/e9fef814489bc670dee5b216e2b2d18af4afeb8a))
- **dropdown:** allow empty `item.text` ([46e661e](https://github.com/carbon-design-system/carbon-components-svelte/commit/46e661e07c888d19eef8ae474c7020646e7d328f))
- **form-group:** allow empty value for `aria-labelledby` ([2f25c87](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f25c87a2061c7e7b1824bb39d57d55bbd4a619c))
- **modal:** allow empty value for `aria-label` ([7d79eaf](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d79eaf11a25f28e045e9b798ad5be41d7bfc6c9))
- **multi-select:** allow empty `item.text` and `aria-label` ([151118b](https://github.com/carbon-design-system/carbon-components-svelte/commit/151118b072c2e1653bddd7afa70edb98b9d37ebb))
- **number-input:** dynamically set `aria-describedby` based on state ([6fa377d](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fa377dc9b50bca2f7426741a9332556b2bbd054)), closes [#2613](https://github.com/carbon-design-system/carbon-components-svelte/issues/2613)
- **number-input:** preserve value during invalid decimal input ([9ba0bc9](https://github.com/carbon-design-system/carbon-components-svelte/commit/9ba0bc9cdef31050bfd4010b9c6d4d6bae0e5c40))
- **number-input:** support locale-specific decimal separators ([7665b23](https://github.com/carbon-design-system/carbon-components-svelte/commit/7665b2327da8b18e3e47b4456443874da8409b1e)), closes [#2547](https://github.com/carbon-design-system/carbon-components-svelte/issues/2547)
- **overflow-menu:** allow empty value for `aria-label` ([9a26ae2](https://github.com/carbon-design-system/carbon-components-svelte/commit/9a26ae2b0137424e7d576a6317a0cce371f83f83))
- **select:** dynamically set `aria-describedby` based on state ([9639107](https://github.com/carbon-design-system/carbon-components-svelte/commit/96391075365ce0db7270fd896b05945adfe23e6c))
- **slider:** allow empty `minLabel`/`maxLabel` and `aria-label` ([ffd6d38](https://github.com/carbon-design-system/carbon-components-svelte/commit/ffd6d38f9caf2ef10a450f2fd041d189a4938991))
- **tabs:** allow empty value for `aria-label` ([2a7a133](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a7a133eca2b2c6c469ad2408f5343c5dd241159))
- **toggle:** allow empty value for `aria-label` ([ebfa493](https://github.com/carbon-design-system/carbon-components-svelte/commit/ebfa49384e1e7950ba8b35d93978d87b8b5e9b43))
- **ui-shell:** allow empty value for `aria-label` in `Header` ([32fe5b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/32fe5b1906e450c6a647431d28c449229d21cfa2))

### Performance

- **data-table:** optimize row selection/expansion lookups using Sets ([54dfd41](https://github.com/carbon-design-system/carbon-components-svelte/commit/54dfd41090ee5a4168fc0cefbebd884825f8c06b))
- **data-table:** compute selected/expanded states using `@const` ([efd5ae8](https://github.com/carbon-design-system/carbon-components-svelte/commit/efd5ae879999ef599fb67f22c72ffe66fa1522ca))
- **data-table:** recompute `tableCellsByRowId` only when rows/headers change ([b372c91](https://github.com/carbon-design-system/carbon-components-svelte/commit/b372c91feb1ceee32bbb06f12cfed7f1438e85d4))
- **data-table:** avoid redundant copy in `sortedRows` when sorting disabled ([6dd07f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/6dd07f013c8ce3902b850322b71c6a21250030c2))
- **data-table:** use Set in expand/select handlers ([a9c9101](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9c910117d7d3fd378c16090dc62c02f9c935674))
- **data-table:** update `batchSelectedIds` only when selected value changes ([da603ea](https://github.com/carbon-design-system/carbon-components-svelte/commit/da603ea59aadb0fa625ab534901872395be4299d))
- **tree-view:** use Set lookups for selected/expanded instead of array includes ([f582b05](https://github.com/carbon-design-system/carbon-components-svelte/commit/f582b052c489689e844c8f1c5b255e0f42c9590d))
- **tree-view:** guard store updates by `activeId` value equality ([f0928a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/f0928a1fe33852f1d8b88d4343b3a15a22afbc94))

### [0.99.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.99.0...v0.99.1) (2026-01-28)

### Bug Fixes

- **tree-view:** `autoCollapse` respects `activeId` ([48673a1](https://github.com/carbon-design-system/carbon-components-svelte/commit/48673a1fcea615d9fe8518ad2c98986598ca7ea0)), closes [#2491](https://github.com/carbon-design-system/carbon-components-svelte/issues/2491)

## [0.99.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.8...v0.99.0) (2026-01-27)

### ⚠ BREAKING CHANGES

- **header:** rename slot "skip-to-content" to "skipToContent" for Svelte 5 support
- **data-table:** rename slot "cell-header" to "cellHeader" for Svelte 5 support

### Features

- **combo-box:** support virtualized items ([350a54e](https://github.com/carbon-design-system/carbon-components-svelte/commit/350a54eef3f59d0a7e7f6e109ad659c7f9849d61)), closes [#2395](https://github.com/carbon-design-system/carbon-components-svelte/issues/2395)
- **dropdown:** support virtualized items ([f15f853](https://github.com/carbon-design-system/carbon-components-svelte/commit/f15f8533b24fbdcbd702a93a2fb6433122fe8fbb)), closes [#2396](https://github.com/carbon-design-system/carbon-components-svelte/issues/2396)
- **local-storage:** auto-sync updates across tabs ([f966856](https://github.com/carbon-design-system/carbon-components-svelte/commit/f96685652a7d600d4437932527eb2d4555a95890))
- **multi-select:** support virtualized items ([a9acb11](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9acb113e1f8c3493a163e661989d8b72e8dd5c4)), closes [#1623](https://github.com/carbon-design-system/carbon-components-svelte/issues/1623)
- **radio-button:** support implicit grouping via `name` attribute ([11b2684](https://github.com/carbon-design-system/carbon-components-svelte/commit/11b26845da742458a91391bb1e51137a848966a7))
- **tree-view:** add `autoCollapse` ([226d301](https://github.com/carbon-design-system/carbon-components-svelte/commit/226d3010bad9e18bd698e47fc1d5539a4bb913e9)), closes [#2491](https://github.com/carbon-design-system/carbon-components-svelte/issues/2491)
- **tree-view:** pass all tree view node props via slots ([1084461](https://github.com/carbon-design-system/carbon-components-svelte/commit/1084461369cf989690aa60b3eccdeeea72af427a))

### Bug Fixes

- **combo-box:** `clearFilterOnOpen` restores value after typing ([4e4b582](https://github.com/carbon-design-system/carbon-components-svelte/commit/4e4b5824539041462141a4f07623d8efb67c9ab5)), closes [#2579](https://github.com/carbon-design-system/carbon-components-svelte/issues/2579)
- **combo-box:** `ComboBoxItemId` is generic, defaulting to `any` ([31336b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/31336b1ffeb1957de655056ec30608fb890cca55))
- **combo-box:** keyboard navigation starts at selected item index ([73a90aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/73a90aac72afc2c23c20ec17ada63baec10d1220))
- **data-table:** `DataTableRowId` is generic, defaulting to `any` ([aae89c0](https://github.com/carbon-design-system/carbon-components-svelte/commit/aae89c0569d827c6179a436944ae7c7ef1fadcee))
- **dropdown:** `DropdownItem` id generic, defaulting to `any` ([72820f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/72820f725ed2f3c63782c17bddc460f308b6856f)), closes [#2564](https://github.com/carbon-design-system/carbon-components-svelte/issues/2564)
- **dropdown:** keyboard navigation starts at selected item index ([23549f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/23549f6790679af0ecdd609c7099ef411988de23)), closes [#2575](https://github.com/carbon-design-system/carbon-components-svelte/issues/2575)
- **multi-select:** `MultiSelectItemId` is generic, defaulting to `any` ([01549bb](https://github.com/carbon-design-system/carbon-components-svelte/commit/01549bb67d49c0d1de58b3cf8d5bc6316b024496))
- **number-input:** add styles for `type="text"` ([83ac138](https://github.com/carbon-design-system/carbon-components-svelte/commit/83ac1382da6041b5d656a45537aba48928514ae4))
- **number-input:** allow deleting all characters if `allowDecimal` is true ([5d36b14](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d36b14db89a302e33ddad424dd1eca311f86bd1))
- **number-input:** include correct styles for `allowDecimal` input ([e32fb3e](https://github.com/carbon-design-system/carbon-components-svelte/commit/e32fb3ee0207fb25ace5229b1d7747181712676e))
- **overflow-menu:** item supports `target` and `rel` props ([61ef1ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/61ef1ba3e88393ff93aa6310cbafc50e3c19ed67)), closes [#2559](https://github.com/carbon-design-system/carbon-components-svelte/issues/2559)
- **toolbar-search:** `ToolbarSearch` preserves generic row ID types ([87b2cfe](https://github.com/carbon-design-system/carbon-components-svelte/commit/87b2cfef0d610f237de481414d5c4d738dee5123))
- **tree-view:** `TreeNodeId` is generic, defaulting to `string | number` ([3b5f8c1](https://github.com/carbon-design-system/carbon-components-svelte/commit/3b5f8c13a374d3cabdac91b9e59aee60ca100d01))
- **types:** generic component props should extend default values ([9d4b1f0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d4b1f08acbbee090e04210ea42d3e1a3d892c36))

### [0.98.8](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.7...v0.98.8) (2026-01-19)

### Bug Fixes

- **code-snippet:** prevent dispatching initial "collapse" event in Svelte 5 ([81758aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/81758aaedc575fade31dccaec942e1b858f51a47)), closes [#2527](https://github.com/carbon-design-system/carbon-components-svelte/issues/2527)
- **header-search:** prevent dispatching initial "inactive" event in Svelte 5 ([0b63452](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b63452a8e965d4a8d9e4d57ea9c925d0e030141)), closes [#2532](https://github.com/carbon-design-system/carbon-components-svelte/issues/2532)
- **pagination:** prevent dispatching initial "update" event in Svelte 5 ([ab72262](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab72262494aa78d6693ecb096b9f519aee9c2a25)), closes [#2528](https://github.com/carbon-design-system/carbon-components-svelte/issues/2528)
- **search:** prevent dispatching initial "collapse" event in Svelte 5 ([7a2ebbe](https://github.com/carbon-design-system/carbon-components-svelte/commit/7a2ebbed6d5627bc58e4af2017a2743977c58445)), closes [#2529](https://github.com/carbon-design-system/carbon-components-svelte/issues/2529)
- **side-nav:** prevent dispatching initial "close" event in Svelte 5 ([3f2a6fe](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f2a6fee73186c66f2304c25f1f4d0671337c81a)), closes [#2533](https://github.com/carbon-design-system/carbon-components-svelte/issues/2533)
- **theme:** prevent dispatching initial "update" event in Svelte 5 ([7f3924b](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f3924bd193cda29a55dd1d3e6fd56628e8d843b)), closes [#2530](https://github.com/carbon-design-system/carbon-components-svelte/issues/2530)
- **tooltip-definition:** prevent dispatching initial "close" event in Svelte 5 ([edf69cf](https://github.com/carbon-design-system/carbon-components-svelte/commit/edf69cfd0a4464b437998bc13318c4bbc37aed54)), closes [#2531](https://github.com/carbon-design-system/carbon-components-svelte/issues/2531)

### [0.98.7](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.6...v0.98.7) (2026-01-19)

### Bug Fixes

- **multi-select:** prevent dispatching initial "select" event in Svelte 5 ([e4c7797](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4c7797d7ea860f600fb82d3718eeab234cf8c95)), closes [#2525](https://github.com/carbon-design-system/carbon-components-svelte/issues/2525)

## [0.98.6](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.5...v0.98.6) (2026-01-18)

### Bug Fixes

- **select:** remove unused `SelectValue` type ([123bf08](https://github.com/carbon-design-system/carbon-components-svelte/commit/123bf081eb823d08308defe32452113517f6c308))
- **theme:** pass `CarbonTheme` to generic `SelectProps` ([ca62ac9](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca62ac949a05e4c8c302ae21361cb376d007ff64))
- **ui-shell:** `SideNav` overlays `UIShell` content ([8ed59f1](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ed59f11276eb96c493dab4056d94481ae4a32ef)), closes [#2520](https://github.com/carbon-design-system/carbon-components-svelte/issues/2520) [#1463](https://github.com/carbon-design-system/carbon-components-svelte/issues/1463) [#544](https://github.com/carbon-design-system/carbon-components-svelte/issues/544)

### [0.98.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.4...v0.98.5) (2026-01-17)

### Bug Fixes

- **tree-view:** accessors use generic `Node` type ([0bfdfb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/0bfdfb081cc725540abd763394c4f86122baf1cf))
- **types:** context types support generics ([9066426](https://github.com/carbon-design-system/carbon-components-svelte/commit/90664262cfe505d2ed1d222fbb1c6de591eaaa39))
- **types:** fix `truncate` function type ([fee3592](https://github.com/carbon-design-system/carbon-components-svelte/commit/fee3592297df95335890e79e85500a594d32e4f7))

### [0.98.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.3...v0.98.4) (2026-01-17)

### Bug Fixes

- **types:** generate default slot props for Svelte 5 `#snippet` usage ([6f5eb78](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f5eb78873d68c0dfbc76a419fdb40e64aded890)), closes [#2505](https://github.com/carbon-design-system/carbon-components-svelte/issues/2505)

### [0.98.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.2...v0.98.3) (2026-01-17)

### Bug Fixes

- **types:** named slot props for `#snippet` usage includes args ([7448035](https://github.com/carbon-design-system/carbon-components-svelte/commit/7448035711a98cf193a2b4f57aabab6bbd189f0e)), closes [#2505](https://github.com/carbon-design-system/carbon-components-svelte/issues/2505)

### [0.98.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.1...v0.98.2) (2026-01-17)

### Bug Fixes

- **multi-select:** selected options have `aria-checked` state ([aa87856](https://github.com/carbon-design-system/carbon-components-svelte/commit/aa8785698d0b1ed6034c11209a37d94b674f1db6))
- **types:** generate named slot props for Svelte 5 `#snippet` usage ([6069a65](https://github.com/carbon-design-system/carbon-components-svelte/commit/6069a6550a46745da0dee6d422a67c945a142e38))

### [0.98.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.98.0...v0.98.1) (2025-12-26)

### Bug Fixes

- **checkbox:** prevent duplicate "check" event dispatches in Svelte 5 ([7b85c5f](https://github.com/carbon-design-system/carbon-components-svelte/commit/7b85c5f4a117c8cb9f3f8882bf6dae6f63adc9b7)), closes [#2467](https://github.com/carbon-design-system/carbon-components-svelte/issues/2467)
- **combo-box:** ensure bind:value syncs when clearing via keyboard ([4f052e5](https://github.com/carbon-design-system/carbon-components-svelte/commit/4f052e55e29fe1e537b7448342639832ded82552)), closes [#2470](https://github.com/carbon-design-system/carbon-components-svelte/issues/2470)
- **combo-box:** prevent dispatching initial "select" event in Svelte 5 ([38c428d](https://github.com/carbon-design-system/carbon-components-svelte/commit/38c428d8ba1bd94c3194b8321a968c550670ff58)), closes [#2472](https://github.com/carbon-design-system/carbon-components-svelte/issues/2472)
- **content-switcher:** fix focus management for Svelte 5 compatibility ([521d628](https://github.com/carbon-design-system/carbon-components-svelte/commit/521d628a688af462913527d035ebee37f5c0bad0)), closes [#2468](https://github.com/carbon-design-system/carbon-components-svelte/issues/2468)
- **data-table:** `PropertyPath` depth limit supports 4 levels ([dd0b142](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd0b142723430fd6fba262f71bce51f83bbf0f6b))
- **structured-list:** prevent dispatching initial "change" event in Svelte 5 ([5291165](https://github.com/carbon-design-system/carbon-components-svelte/commit/5291165ec8a994d7f9c4b7458d0fa15374ea502d)), closes [#2478](https://github.com/carbon-design-system/carbon-components-svelte/issues/2478)
- **toolbar-search:** replace `JSON.stringify` with custom deep comparison for filtered rows ([14a565b](https://github.com/carbon-design-system/carbon-components-svelte/commit/14a565b4e6b41de0f73751e3fb3589934054dd3e))
- **tooltip:** prevent dispatching initial "close" event in Svelte 5 ([5abd2ba](https://github.com/carbon-design-system/carbon-components-svelte/commit/5abd2ba788090df1720402023b78f60a4aa12ff6)), closes [#2475](https://github.com/carbon-design-system/carbon-components-svelte/issues/2475)

### Performance

- **data-table:** optimize `resolvePath` utility ([41b7b6b](https://github.com/carbon-design-system/carbon-components-svelte/commit/41b7b6b9e1b4e925341da9cd75779ec79c83cc63))
- **tree-view:** optimize node traversal ([7eeb844](https://github.com/carbon-design-system/carbon-components-svelte/commit/7eeb844ca69f48fa68733c67937ceaa1030add5c))
- **tree-view:** optimize `showNode` and batch active/selected updates ([e537ba3](https://github.com/carbon-design-system/carbon-components-svelte/commit/e537ba357978051a3ae3390e1ebd2a261d224684))

### [0.98.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.97.0...v0.98.0) (2025-12-21)

### Features

- **contained-list:** add `ContainedList` and `ContainedListItem` ([836f5e7](https://github.com/carbon-design-system/carbon-components-svelte/commit/836f5e7095b5d198422dcbfc2a0acc0c17de0235))
- **file-uploader:** add `maxFileSize` prop ([0eb5f9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/0eb5f9ddcc4a761c9eaef076c7599c805bb1ef79))
- **heading:** add `Heading` and `Section` components ([c028489](https://github.com/carbon-design-system/carbon-components-svelte/commit/c0284894cff73dfc9d69298369b00d66fbc24ddc))
- **slider:** support warning state ([303ec5c](https://github.com/carbon-design-system/carbon-components-svelte/commit/303ec5c6b3dca2138c2875203705fbd23dde0c91)), closes [#2444](https://github.com/carbon-design-system/carbon-components-svelte/issues/2444)

### Bug Fixes

- **radio-tile:** forward `aria-*` attributes to input element ([489fd2c](https://github.com/carbon-design-system/carbon-components-svelte/commit/489fd2cebc40e7eb99089f25eff71cce4c515623))

### [0.97.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.96.0...v0.97.0) (2025-12-21)

### Features

- **file-uploader-button:** support `icon` ([eed238c](https://github.com/carbon-design-system/carbon-components-svelte/commit/eed238c2a2a2c3047c030c58f22a2707a395c59d)), closes [#2433](https://github.com/carbon-design-system/carbon-components-svelte/issues/2433)
- **slider:** support `invalidText` ([9588710](https://github.com/carbon-design-system/carbon-components-svelte/commit/9588710de94231f3389e8d924f739ad9f86bc410)), closes [#2445](https://github.com/carbon-design-system/carbon-components-svelte/issues/2445)
- **slider:** support `readOnly` ([494cb55](https://github.com/carbon-design-system/carbon-components-svelte/commit/494cb55ee510d0026892b1f40844cd7bee59ede7)), closes [#2443](https://github.com/carbon-design-system/carbon-components-svelte/issues/2443)
- **stack:** add `align` and `justify` props ([9044402](https://github.com/carbon-design-system/carbon-components-svelte/commit/90444027b9d4870f078411e0482ab4e6d28692c0))

### Bug Fixes

- **file-uploader-button:** prevent crash when `files` is cleared ([5ce7a04](https://github.com/carbon-design-system/carbon-components-svelte/commit/5ce7a04f1a518c7ca414df378d1ba85182d584a9)), closes [#2436](https://github.com/carbon-design-system/carbon-components-svelte/issues/2436)
- **slider:** fix typo in `labelText` prop description ([e4f4ed0](https://github.com/carbon-design-system/carbon-components-svelte/commit/e4f4ed0a9d216420778432cbf3f514ca6e1cfd85))
- **tree-view-node:** make `findParentTreeNode` and `computeTreeLeafDepth` stricter ([d91295b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d91295b1c6156e3d9a1df2c77b2dda35c58af50e))

## [0.96.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.95.1...v0.96.0) (2025-12-14)

### ⚠ BREAKING CHANGES

- **radio-button-group:** change `legendText` slot to `legendChildren`
- **tile-group:** rename `legend` to `legendText`
- **selectable-tile-group:** rename `legend` to `legendText`
- **data-table:** change `title`/`description` slots to `titleChildren`, `descriptionChildren`
- **inline-notification:** change `title`/`subtitle`/`caption` slot names to `titleChildren`/`subtitleChildren`/`captionChildren`
- **toast-notification:** change `title`/`subtitle`/`caption` slot names to `titleChildren`/`subtitleChildren`/`captionChildren`
- **header:** change `company` prop to `companyText`
- **header-action:** change `text` slot to `textChildren`
- **context-menu-option:** change `labelText` slot to `labelChildren`
- **file-uploader-drop-container:** change `labelText` slot to `labelChildren`
- **file-uploader-button:** change `labelText` slot to `labelChildren`
- **number-input:** change `labelText` slot to `labelChildren`
- **text-area:** change `labelText` slot to `labelChildren`
- **text-input:** change `labelText` slot to `labelChildren`
- **password-input:** change `labelText` slot to `labelChildren`
- **date-picker-input:** change `labelText` slot to `labelChildren`
- **toggle-skeleton:** change `labelText` slot to `labelChildren`
- **toggle:** change `labelText` slot to `labelChildren`
- **search:** change `labelText` slot to `labelChildren`
- **multi-select:** change `labelText` slot to `labelChildren`
- **select:** change `labelText` slot to `labelChildren`
- **combo-box:** change `labelText` slot to `labelChildren`
- **progress-bar:** change `labelText` slot to `labelChildren`
- **slider:** change `labelText` slot to `labelChildren`
- **checkbox:** change `labelText` slot to `labelChildren`
- **tree-view:** change `labelText` slot to `labelChildren`
- **radio-button:** change `labelText` slot to `labelChildren`
- **time-picker:** change `labelText` slot to `labelChildren`
- **time-picker-select:** change `labelText` slot to `labelChildren`

### Features

- **inline-notification:** add `open` prop ([63058c6](https://github.com/carbon-design-system/carbon-components-svelte/commit/63058c6b3f12f9b4ced0c5123b02569273fda60b)), closes [#630](https://github.com/carbon-design-system/carbon-components-svelte/issues/630)
- **selectable-tile-group:** add `legendChildren` slot ([ddb6abd](https://github.com/carbon-design-system/carbon-components-svelte/commit/ddb6abd78b1912b30b7764a4ed3c4beb03c81536))
- **stack:** support `gap={0}` ([e374436](https://github.com/carbon-design-system/carbon-components-svelte/commit/e374436204adac6cae8a665b4eaa39efd8c6616e)), closes [#2426](https://github.com/carbon-design-system/carbon-components-svelte/issues/2426)
- **tile-group:** add `legendChildren` slot ([4ff133b](https://github.com/carbon-design-system/carbon-components-svelte/commit/4ff133b202c45a47f7e287d4479d8bccdfc35566))
- **toast-notification:** add `open` prop ([d703135](https://github.com/carbon-design-system/carbon-components-svelte/commit/d70313509920c11687bf91b5709e470d8cbe259b))

### Bug Fixes

- **pagination:** update JSDoc descriptions for dispatched events ([4588944](https://github.com/carbon-design-system/carbon-components-svelte/commit/4588944c4c394cf45ebc61c40dfa85288df4d30d))
- **stack:** include styles for individual themes ([397ccba](https://github.com/carbon-design-system/carbon-components-svelte/commit/397ccbaf33fa9f9720eaece4096d8e508df7da62)), closes [#2417](https://github.com/carbon-design-system/carbon-components-svelte/issues/2417)
- **time-picker:** allow longer labels ([3d1d187](https://github.com/carbon-design-system/carbon-components-svelte/commit/3d1d1876e0ad43ea268be713df4a91e682165f73)), closes [#1749](https://github.com/carbon-design-system/carbon-components-svelte/issues/1749)

### [0.95.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.95.0...v0.95.1) (2025-12-04)

### Bug Fixes

- **toolbar:** omit `inert` when batch actions are not present ([667fe61](https://github.com/carbon-design-system/carbon-components-svelte/commit/667fe61b3d88dfa23dabbe651029e2402e7852e7)), closes [#2404](https://github.com/carbon-design-system/carbon-components-svelte/issues/2404)

### [0.95.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.94.0...v0.95.0) (2025-12-01)

### Features

- **modal:** add `formId` prop to enable native form submission ([2a5c274](https://github.com/carbon-design-system/carbon-components-svelte/commit/2a5c27451c115c1cb5422493a92f0bc67b26e8d2)), closes [#310](https://github.com/carbon-design-system/carbon-components-svelte/issues/310)
- **portal:** add `Portal` component ([4982e26](https://github.com/carbon-design-system/carbon-components-svelte/commit/4982e26c624e9c8d9e8167e21247ee520a38ae48)), closes [#2280](https://github.com/carbon-design-system/carbon-components-svelte/issues/2280)

### Bug Fixes

- **number-input:** only show invalid state when `invalid` and `invalidText` are set ([#2384](https://github.com/carbon-design-system/carbon-components-svelte/issues/2384)) ([e06340c](https://github.com/carbon-design-system/carbon-components-svelte/commit/e06340c3776aefdae3f77f92eb04da3864a1ce41)), closes [#1180](https://github.com/carbon-design-system/carbon-components-svelte/issues/1180)
- **tabs:** avoid infinite update loop in Svelte 5 ([#2394](https://github.com/carbon-design-system/carbon-components-svelte/issues/2394)) ([65316af](https://github.com/carbon-design-system/carbon-components-svelte/commit/65316af5e508576e2f9ebe8dd7e2a08aca5376af)), closes [#2366](https://github.com/carbon-design-system/carbon-components-svelte/issues/2366)

## [0.94.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.93.0...v0.94.0) (2025-11-29)

### ⚠ BREAKING CHANGES

- **progress-step:** remove one-update delay for `complete` prop (#2368)

### Features

- **header-search:** support TypeScript generics ([5d0468a](https://github.com/carbon-design-system/carbon-components-svelte/commit/5d0468aed5e62a3275ecefe99edf859ac3f753ef))
- **notification:** add `NotificationQueue` component ([9560791](https://github.com/carbon-design-system/carbon-components-svelte/commit/956079131853ceae6852fb1ad7b26e776a354dbd)), closes [#2283](https://github.com/carbon-design-system/carbon-components-svelte/issues/2283)
- **recursive-list:** support TypeScript generics ([b200828](https://github.com/carbon-design-system/carbon-components-svelte/commit/b2008288364a16c8e5690b1c4ce70405cc0c468d))
- **selectable-tile:** add `SelectableTileGroup` component ([6ba0fdf](https://github.com/carbon-design-system/carbon-components-svelte/commit/6ba0fdf97fcc2e1283b32c0c8f04bea45cd3198b))
- **select:** support TypeScript generics ([d57b375](https://github.com/carbon-design-system/carbon-components-svelte/commit/d57b3754de9721a38cbb09f703e76a9327c678d3))
- **theme:** export `themes` constant ([776e471](https://github.com/carbon-design-system/carbon-components-svelte/commit/776e4715e858e88fe57afd4c9d9c7962f3167b38)), closes [#939](https://github.com/carbon-design-system/carbon-components-svelte/issues/939)
- **tile-group:** make `selectedValue` and `selected` generic ([#2374](https://github.com/carbon-design-system/carbon-components-svelte/issues/2374)) ([209cc02](https://github.com/carbon-design-system/carbon-components-svelte/commit/209cc02fb53e744f7dd2b3142249d5b9425bdf29))
- **tree-view:** support TypeScript generics ([9efbbda](https://github.com/carbon-design-system/carbon-components-svelte/commit/9efbbda3c3e4faaf4ebec839dfae42e17aa85233))

### Bug Fixes

- **inline-notification:** conditionally render title/subtitle ([751190c](https://github.com/carbon-design-system/carbon-components-svelte/commit/751190cee9d2d3b5ed8d564551b5c67d37182e25)), closes [#2379](https://github.com/carbon-design-system/carbon-components-svelte/issues/2379)
- **toast-notification:** conditionally render subtitle/caption ([f4d2091](https://github.com/carbon-design-system/carbon-components-svelte/commit/f4d209121496dfad733d658e9615cadafc96acea))
- **modal:** improve focus trap for `Dropdown` and other components ([#2369](https://github.com/carbon-design-system/carbon-components-svelte/issues/2369)) ([d11e3ac](https://github.com/carbon-design-system/carbon-components-svelte/commit/d11e3ac9ad9da9875bed68b716cc82f231a6f959)), closes [#1392](https://github.com/carbon-design-system/carbon-components-svelte/issues/1392)
- **tabs:** avoid infinite update loop in Svelte 5 ([#2367](https://github.com/carbon-design-system/carbon-components-svelte/issues/2367)) ([413aab5](https://github.com/carbon-design-system/carbon-components-svelte/commit/413aab54fc66fda1d5282a0d0bcc60af2dc8c89b)), closes [#2366](https://github.com/carbon-design-system/carbon-components-svelte/issues/2366)
- **tile-group:** improve context types for `SelectableTileGroup` and `TileGroup` ([#2375](https://github.com/carbon-design-system/carbon-components-svelte/issues/2375)) ([ff144d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/ff144d272ddb9fb1b9d4f75c3098316afd0b50ec))

## [0.93.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.92.0...v0.93.0) (2025-11-22)

### ⚠ BREAKING CHANGES

- **number-input:** remove unused `iconDescription` prop (#2354)
- **file-uploader:** use `button` for accessibility ([#2351](https://github.com/carbon-design-system/carbon-components-svelte/issues/2351)) ([ace3376](https://github.com/carbon-design-system/carbon-components-svelte/commit/ace3376b3f9efeab3f3bd1b6f6a5abab84623ee0))

### Features

- **data-table:** add `tableHeaderTranslateWithId` prop ([864d687](https://github.com/carbon-design-system/carbon-components-svelte/commit/864d6875bc8384f52bcdb9d1f66c05feb621ccfc))
- **overflow-menu:** support `e.preventDefault` on item click ([#2360](https://github.com/carbon-design-system/carbon-components-svelte/issues/2360)) ([e63b7d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/e63b7d893abbc8fd3eadac1eb54d6559c606494a))
- **stack:** add `Stack` component ([#2352](https://github.com/carbon-design-system/carbon-components-svelte/issues/2352)) ([bf3b93a](https://github.com/carbon-design-system/carbon-components-svelte/commit/bf3b93ae2de210f8a3d1bcf618ac9966b72aa07e)), closes [#2278](https://github.com/carbon-design-system/carbon-components-svelte/issues/2278)
- **types:** add `[@example](https://github.com/example)` tags for accessors ([0192d0e](https://github.com/carbon-design-system/carbon-components-svelte/commit/0192d0e9938a5c48d7f08c7bfaed54b3d8a2b8d8))

### Bug Fixes

- **context-menu:** close on any click instead of only outside clicks ([#2349](https://github.com/carbon-design-system/carbon-components-svelte/issues/2349)) ([a980071](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9800715ca8a8cc0fa84ae97d386dd456b4b7024)), closes [#578](https://github.com/carbon-design-system/carbon-components-svelte/issues/578)
- **data-table:** restore `target` and `currentTarget` types ([#2345](https://github.com/carbon-design-system/carbon-components-svelte/issues/2345)) ([6b11d7a](https://github.com/carbon-design-system/carbon-components-svelte/commit/6b11d7a2f37d2670847b33c96570415f5c48807f)), closes [#2344](https://github.com/carbon-design-system/carbon-components-svelte/issues/2344)
- **dropdown:** support typeahead when menu is open ([#2357](https://github.com/carbon-design-system/carbon-components-svelte/issues/2357)) ([f2b5056](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2b50563d4a91af4a38c4164821fbf9306261cf3)), closes [#1975](https://github.com/carbon-design-system/carbon-components-svelte/issues/1975)
- **number-input:** remove unused `iconDescription` prop ([#2354](https://github.com/carbon-design-system/carbon-components-svelte/issues/2354)) ([7e5d437](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e5d437f66f968ab1c6cef409f9733a9d170daf4))
- **table-header:** implement `translateWithId` ([c4eed4d](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4eed4dda7fff44e50c7a4f711cd4a40172394d2))
- **tabs:** resolve index de-sync from dynamic tab rendering ([8a2d0ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/8a2d0ae2a74bba7626b0e59e6586237b18115207)), closes [#1537](https://github.com/carbon-design-system/carbon-components-svelte/issues/1537)
- **toolbar:** prevent keyboard focus on hidden toolbar elements ([#2359](https://github.com/carbon-design-system/carbon-components-svelte/issues/2359)) ([bdaf6b5](https://github.com/carbon-design-system/carbon-components-svelte/commit/bdaf6b558d8c94909c7592fdcc1946a40a31bb19)), closes [#663](https://github.com/carbon-design-system/carbon-components-svelte/issues/663)

## [0.92.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.91.0...v0.92.0) (2025-11-13)

### ⚠ BREAKING CHANGES

- **number-input:** rename `label` to `labelText`
- **multi-select:** rename `titleText` to `labelText`
- **dropdown:** rename `titleText` to `labelText`
- **combo-box:** rename `titleText` to `labelText`

### Features

- **combo-box:** add `typeahead` prop for autocomplete ([#2340](https://github.com/carbon-design-system/carbon-components-svelte/issues/2340)) ([40ab3b7](https://github.com/carbon-design-system/carbon-components-svelte/commit/40ab3b71791dc35714cf7e16f50abff5095f9362)), closes [#2275](https://github.com/carbon-design-system/carbon-components-svelte/issues/2275)

### Bug Fixes

- **composed-modal:** make closed modal inert ([1002ad3](https://github.com/carbon-design-system/carbon-components-svelte/commit/1002ad39c807df0b0ba093e6f75fc8333a8368ae)), closes [#2338](https://github.com/carbon-design-system/carbon-components-svelte/issues/2338)
- **modal:** make closed modal inert ([8e32236](https://github.com/carbon-design-system/carbon-components-svelte/commit/8e32236e9e92ba9168ff0248cb45ad3e46c275a8)), closes [#2338](https://github.com/carbon-design-system/carbon-components-svelte/issues/2338)

### [0.91.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.90.2...v0.91.0) (2025-11-10)

### Features

- **combo-box:** support TypeScript generics ([9e3ce77](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e3ce775617aecd31e914723a6f6d313c2eb9254))
- **dropdown:** support TypeScript generics ([65572ec](https://github.com/carbon-design-system/carbon-components-svelte/commit/65572ecec461a2a9112c37ef6025b5d090e6e068))
- **multi-select:** support TypeScript generics ([1b3d067](https://github.com/carbon-design-system/carbon-components-svelte/commit/1b3d06757e9e6095f0a27b92328b4e2b129d5f1c))
- **tree-view:** `showNode` is configurable ([6f23803](https://github.com/carbon-design-system/carbon-components-svelte/commit/6f238034abfeb5c095715b497c84c86d6b10f059)), closes [#2282](https://github.com/carbon-design-system/carbon-components-svelte/issues/2282)
- **tree-view:** add `filterTreeNodes` utilities ([038a4f4](https://github.com/carbon-design-system/carbon-components-svelte/commit/038a4f4b96a9a6579962b872e1407dc30b32dd82)), closes [#2281](https://github.com/carbon-design-system/carbon-components-svelte/issues/2281)
- **types:** annotate typedefs and dispatched events ([#2322](https://github.com/carbon-design-system/carbon-components-svelte/issues/2322)) ([7632c03](https://github.com/carbon-design-system/carbon-components-svelte/commit/7632c03d1bb2e1287210865d60fe49597dc4812e))

### Bug Fixes

- **breakpoint:** use `declare const` in types ([#2330](https://github.com/carbon-design-system/carbon-components-svelte/issues/2330)) ([24152e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/24152e29fc5677d0f3263cd42a5393d5a5a13c4e))
- **multi-select:** restore complete keyboard navigation for filterable variant ([#2317](https://github.com/carbon-design-system/carbon-components-svelte/issues/2317)) ([2c0ae9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/2c0ae9e30bcb7e09e83767c1c90b9e43d903ea3c)), closes [#2313](https://github.com/carbon-design-system/carbon-components-svelte/issues/2313)
- **slider:** store event object for drag calculations ([#2320](https://github.com/carbon-design-system/carbon-components-svelte/issues/2320)) ([50f010d](https://github.com/carbon-design-system/carbon-components-svelte/commit/50f010d7ce532e29890336be1d34411fac85bf98))
- **tree-view-node:** correctly type `computeTreeLeafDepth` export ([cbe7d93](https://github.com/carbon-design-system/carbon-components-svelte/commit/cbe7d93a92af9a93257e7328cec8a25fc4ce4229))
- **types:** correctly generate `[@default](https://github.com/default)` values ([f2c0701](https://github.com/carbon-design-system/carbon-components-svelte/commit/f2c07011be488a3284d6c7f7a2704a51e1e680d7))
- **types:** generate types for all components ([b90a1f2](https://github.com/carbon-design-system/carbon-components-svelte/commit/b90a1f21f0d82b73bd430ec82bc1df2a9b45e029))
- **types:** re-generate `types/index.d.ts` ([47cd789](https://github.com/carbon-design-system/carbon-components-svelte/commit/47cd7891bb989c797b34a528fbe8d5165cb54ae8))
- **types:** remove function code from `[@default](https://github.com/default)` tags ([527f34f](https://github.com/carbon-design-system/carbon-components-svelte/commit/527f34fd3a6f3c29739c64e6f489fd7949d139e7))

### [0.90.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.90.1...v0.90.2) (2025-11-08)

### Bug Fixes

- **button:** icon slot includes `style` prop in TypeScript definitions ([8507917](https://github.com/carbon-design-system/carbon-components-svelte/commit/8507917d693a93471b5858e6ab21965eeab17efe))
- **multi-select:** restore keyboard navigation for filterable variant ([#2314](https://github.com/carbon-design-system/carbon-components-svelte/issues/2314)) ([7d849d2](https://github.com/carbon-design-system/carbon-components-svelte/commit/7d849d282a580cd62a075fc8f125263aa71de4d0)), closes [#2313](https://github.com/carbon-design-system/carbon-components-svelte/issues/2313)
- **number-input:** avoid global `isNaN` ([f93aab2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f93aab28c6098197d0bef6d438a663042d0f96fe))
- **tooltip:** avoid useless ternary ([798fe61](https://github.com/carbon-design-system/carbon-components-svelte/commit/798fe61b795b98fc76dffe4221da11969f341e08))
- **types:** include skeleton props for Button/DataTableSkeleton ([2f08b9a](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f08b9aa8327e3a24fdd9cf4e4f509fbaeaaa947))
- use strict equals in `Breakpoint` and `TextInput` ([a565dc5](https://github.com/carbon-design-system/carbon-components-svelte/commit/a565dc5733c618866686b29b7ddd5f28c6b7d10d))

### [0.90.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.90.0...v0.90.1) (2025-10-26)

### Bug Fixes

- **multi-select:** only focus input if filterable ([25192832](https://github.com/carbon-design-system/carbon-components-svelte/commit/2519283256307735f57428c3d3604f8b370e953a)), closes [#2288](https://github.com/carbon-design-system/carbon-components-svelte/issues/2288)
- **text-input:** fix input value reactivity ([#2234](https://github.com/carbon-design-system/carbon-components-svelte/issues/2234))

## [0.90.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.8...v0.90.0) (2025-10-23)

### ⚠ BREAKING CHANGES

- **data-table:** include `target` and `currentTarget` in row/cell click events (#2264)
- **select:** forward `$$restProps` to `select` element (#2263)
- **text-area:** disallow `resize` if `cols` is specified (#2230)

### Features

- **button:** add `hideTooltip` to hide tooltip for icon-only variant ([ad85269](https://github.com/carbon-design-system/carbon-components-svelte/commit/ad85269d2dc183b1bd514c6e2d408ab17630c830)), closes [#1251](https://github.com/carbon-design-system/carbon-components-svelte/issues/1251)
- **checkbox:** add `helperText` prop ([dd9e1da](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd9e1daec95058b1440c1e1619416b68abe35bf2))
- **combo-box:** add `clearFilterOnOpen` prop ([997cda4](https://github.com/carbon-design-system/carbon-components-svelte/commit/997cda4e15b3f0c2a82e3df3516df04b30f5203a)), closes [#1635](https://github.com/carbon-design-system/carbon-components-svelte/issues/1635)
- **combo-box:** allow custom value ([#2232](https://github.com/carbon-design-system/carbon-components-svelte/issues/2232)) ([1a9c9c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a9c9c4ec903db45e98d59aff8fa4f695ac0e1a7)), closes [#1726](https://github.com/carbon-design-system/carbon-components-svelte/issues/1726)
- **composed-modal:** support cancelable close event ([d256651](https://github.com/carbon-design-system/carbon-components-svelte/commit/d256651b79a8f8069044419a5cb13cab65490b49)), closes [#1549](https://github.com/carbon-design-system/carbon-components-svelte/issues/1549)
- **data-table:** include `target` and `currentTarget` in row/cell click events ([#2264](https://github.com/carbon-design-system/carbon-components-svelte/issues/2264)) ([acdbc13](https://github.com/carbon-design-system/carbon-components-svelte/commit/acdbc13cbaf5a39bdbab857e31c201ae1ffc0ba7)), closes [#1904](https://github.com/carbon-design-system/carbon-components-svelte/issues/1904)
- **data-table:** pass `rowSelected` and `rowExpanded` to slotted row/cell ([15914b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/15914b4b2cc551ea1f844eedb1bbe1c123450a9d)), closes [#1672](https://github.com/carbon-design-system/carbon-components-svelte/issues/1672)
- **modal:** support cancelable close event ([42afc2f](https://github.com/carbon-design-system/carbon-components-svelte/commit/42afc2f0749e6b1e0f564fc704de872afff8c2f6)), closes [#1549](https://github.com/carbon-design-system/carbon-components-svelte/issues/1549)
- **number-input:** allow decimals ([#2233](https://github.com/carbon-design-system/carbon-components-svelte/issues/2233)) ([416d9e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/416d9e9cd6cff99fa2f02bc8d3adfbe7dbf42fe4)), closes [#1873](https://github.com/carbon-design-system/carbon-components-svelte/issues/1873)
- **radio-button:** add `helperText` prop ([53aa6e0](https://github.com/carbon-design-system/carbon-components-svelte/commit/53aa6e0f2b949b0b05f085a4222cd769e321fbd7))
- **text-area:** add `warn` and `warnText` props ([367d607](https://github.com/carbon-design-system/carbon-components-svelte/commit/367d607b31d2902809163e9d12f05502a3bb895a)), closes [#1136](https://github.com/carbon-design-system/carbon-components-svelte/issues/1136)
- **toggle:** add `ref` prop ([#2252](https://github.com/carbon-design-system/carbon-components-svelte/issues/2252)) ([b54876b](https://github.com/carbon-design-system/carbon-components-svelte/commit/b54876bb16a1325ccd97d000c26ca65730601886)), closes [#2218](https://github.com/carbon-design-system/carbon-components-svelte/issues/2218)
- **toolbar:** `ToolbarBatchActions` supports standalone usage ([14ff730](https://github.com/carbon-design-system/carbon-components-svelte/commit/14ff730c1a11951372c47b087b10095c249f94ab)), closes [#2273](https://github.com/carbon-design-system/carbon-components-svelte/issues/2273)
- **ui-shell:** `HeaderNavMenu` implements keyboard navigation ([#2248](https://github.com/carbon-design-system/carbon-components-svelte/issues/2248)) ([b4d7037](https://github.com/carbon-design-system/carbon-components-svelte/commit/b4d7037b251e2b8a3210c906821cc8838d73ece0)), closes [#1068](https://github.com/carbon-design-system/carbon-components-svelte/issues/1068)

### Bug Fixes

- **select:** forward `$$restProps` to `select` element ([#2263](https://github.com/carbon-design-system/carbon-components-svelte/issues/2263)) ([5af6c9d](https://github.com/carbon-design-system/carbon-components-svelte/commit/5af6c9d08a4e64c2c1e8801b7a1818f8227e9c7d))
- **text-area:** disallow `resize` if `cols` is specified ([#2230](https://github.com/carbon-design-system/carbon-components-svelte/issues/2230)) ([92b8581](https://github.com/carbon-design-system/carbon-components-svelte/commit/92b85813f1cee01ef7fe190df14e7c67e082c12f)), closes [#1661](https://github.com/carbon-design-system/carbon-components-svelte/issues/1661)
- **text-area:** polyfill warn state styles ([cc65ac2](https://github.com/carbon-design-system/carbon-components-svelte/commit/cc65ac2ae5f7717a1d4bc0e668a0bccb904c0742)), closes [#1136](https://github.com/carbon-design-system/carbon-components-svelte/issues/1136)

### [0.89.8](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.7...v0.89.8) (2025-10-19)

### Bug Fixes

- **checkbox:** polyfill readonly styles ([c4136e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4136e9c405775d845f7ca3216969c3f71f3d6c3)), closes [#1544](https://github.com/carbon-design-system/carbon-components-svelte/issues/1544)
- **checkbox:** prevent state changes when `readonly` is true ([3f18348](https://github.com/carbon-design-system/carbon-components-svelte/commit/3f183487e4df3bd29cb4506a9b8f91bb8eaae4c0)), closes [#1544](https://github.com/carbon-design-system/carbon-components-svelte/issues/1544)
- **combo-box:** forward `on:input` to enable async filtering ([ba16b1c](https://github.com/carbon-design-system/carbon-components-svelte/commit/ba16b1c8009a51b31251cb5b9b558367711a472c)), closes [#617](https://github.com/carbon-design-system/carbon-components-svelte/issues/617)
- **context-menu:** avoid clipping nested menu on narrow screens ([#2227](https://github.com/carbon-design-system/carbon-components-svelte/issues/2227)) ([1933c0b](https://github.com/carbon-design-system/carbon-components-svelte/commit/1933c0bea07c23e544711e06b762de0cc7deb03e)), closes [#1847](https://github.com/carbon-design-system/carbon-components-svelte/issues/1847)
- **context-menu:** nested menu implements hover intent triangle ([#2221](https://github.com/carbon-design-system/carbon-components-svelte/issues/2221)) ([6403028](https://github.com/carbon-design-system/carbon-components-svelte/commit/64030283c76924d7ab35b26950efa4612bdf2ac4)), closes [#2220](https://github.com/carbon-design-system/carbon-components-svelte/issues/2220)
- **context-menu:** prevent parent menu closure when clicking submenu on mobile ([#2219](https://github.com/carbon-design-system/carbon-components-svelte/issues/2219)) ([597cb57](https://github.com/carbon-design-system/carbon-components-svelte/commit/597cb57bc73df3ad9c4b3942dc6960e017851910)), closes [#1848](https://github.com/carbon-design-system/carbon-components-svelte/issues/1848)
- **data-table:** default filtering supports nested keys ([#2213](https://github.com/carbon-design-system/carbon-components-svelte/issues/2213)) ([484c61d](https://github.com/carbon-design-system/carbon-components-svelte/commit/484c61d7ab5bd7c2a979860170f2e732842f58cb)), closes [#1897](https://github.com/carbon-design-system/carbon-components-svelte/issues/1897)
- **data-table:** title/description slots should override elements ([90f25df](https://github.com/carbon-design-system/carbon-components-svelte/commit/90f25df5e116ca281882d908b77f2489df0bf041)), closes [#1594](https://github.com/carbon-design-system/carbon-components-svelte/issues/1594)
- **date-picker:** allow clearing range dates by setting values to empty strings ([#2236](https://github.com/carbon-design-system/carbon-components-svelte/issues/2236)) ([9b45af8](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b45af8a7aa2fa9bf03c699d8d1f5425b1050d8b)), closes [#1862](https://github.com/carbon-design-system/carbon-components-svelte/issues/1862)
- **date-picker:** dispatch `change` for "single" variant ([#2229](https://github.com/carbon-design-system/carbon-components-svelte/issues/2229)) ([4873a64](https://github.com/carbon-design-system/carbon-components-svelte/commit/4873a64f1b28dd8fc24005d392f2d7dcf8f30b90)), closes [#314](https://github.com/carbon-design-system/carbon-components-svelte/issues/314) [#950](https://github.com/carbon-design-system/carbon-components-svelte/issues/950)
- **dropdown:** remove `parent.addEventListener` to resolve cross-origin iframe error ([#2222](https://github.com/carbon-design-system/carbon-components-svelte/issues/2222)) ([10f549d](https://github.com/carbon-design-system/carbon-components-svelte/commit/10f549dc2388ce8448cb505cde93508a214c3b17)), closes [#1875](https://github.com/carbon-design-system/carbon-components-svelte/issues/1875)
- **file-uploader:** `multiple` should append instead of replace files ([#2223](https://github.com/carbon-design-system/carbon-components-svelte/issues/2223)) ([b44f24d](https://github.com/carbon-design-system/carbon-components-svelte/commit/b44f24d81a8444e6d4ad463fb0c4ead56b8d8dc1)), closes [#1774](https://github.com/carbon-design-system/carbon-components-svelte/issues/1774)
- **file-uploader:** synchronize `input.files` when files removed ([750cd75](https://github.com/carbon-design-system/carbon-components-svelte/commit/750cd752e781df8683b7f8ed4e47227df320797b)), closes [#1785](https://github.com/carbon-design-system/carbon-components-svelte/issues/1785)
- **local-storage:** key is also reactive ([8ef7500](https://github.com/carbon-design-system/carbon-components-svelte/commit/8ef7500d1f421ff1a92e88bf06a68e7274d58ca5)), closes [#1204](https://github.com/carbon-design-system/carbon-components-svelte/issues/1204)
- **modal:** `ModalFooter` prop type `secondaryButtons` allows empty array ([#2211](https://github.com/carbon-design-system/carbon-components-svelte/issues/2211)) ([166ffff](https://github.com/carbon-design-system/carbon-components-svelte/commit/166ffff63d1b4ec390fd9aeb78c66aaa63d2b3fe))
- **multi-select:** address a11y issues ([#2231](https://github.com/carbon-design-system/carbon-components-svelte/issues/2231)) ([c4c335a](https://github.com/carbon-design-system/carbon-components-svelte/commit/c4c335aebc4082ffbeb12e1151f84f87f99325fc)), closes [#2172](https://github.com/carbon-design-system/carbon-components-svelte/issues/2172)
- **multi-select:** filterable variant should not use read-only checkbox ([#2256](https://github.com/carbon-design-system/carbon-components-svelte/issues/2256)) ([a91abb4](https://github.com/carbon-design-system/carbon-components-svelte/commit/a91abb4c4366c682794cb5b4b0d67d503f50704c)), closes [#2255](https://github.com/carbon-design-system/carbon-components-svelte/issues/2255)
- **pagination:** prevent double update when `pageSize` changes on last page ([b5fbd10](https://github.com/carbon-design-system/carbon-components-svelte/commit/b5fbd10f07d9f4f802b927669cdba314c65b4d47)), closes [#1634](https://github.com/carbon-design-system/carbon-components-svelte/issues/1634)
- **radio-button:** allow standalone usage with `checked` prop ([2324d37](https://github.com/carbon-design-system/carbon-components-svelte/commit/2324d377882d6adbadaf58d01aad7e1ce80f5b0e)), closes [#1879](https://github.com/carbon-design-system/carbon-components-svelte/issues/1879)
- **select:** avoid rendering empty label element ([#2246](https://github.com/carbon-design-system/carbon-components-svelte/issues/2246)) ([91a218d](https://github.com/carbon-design-system/carbon-components-svelte/commit/91a218db7659179d4fa08a66adea919c9dfd74dd)), closes [#1977](https://github.com/carbon-design-system/carbon-components-svelte/issues/1977)
- **slider:** dispatch `on:input` for keyboard events ([#2215](https://github.com/carbon-design-system/carbon-components-svelte/issues/2215)) ([42371f6](https://github.com/carbon-design-system/carbon-components-svelte/commit/42371f6793dc506c9704fbe2089acdb775d4f111)), closes [#1980](https://github.com/carbon-design-system/carbon-components-svelte/issues/1980)
- **slider:** round `Shift+Arrow` values to valid steps ([#2216](https://github.com/carbon-design-system/carbon-components-svelte/issues/2216)) ([1eb0216](https://github.com/carbon-design-system/carbon-components-svelte/commit/1eb0216067fe5a56bc97f5b3afb1376bfcb29df0)), closes [#1219](https://github.com/carbon-design-system/carbon-components-svelte/issues/1219)
- **text-input:** preserve HTML5 validation for `type="number"` ([#2234](https://github.com/carbon-design-system/carbon-components-svelte/issues/2234)) ([54b7c65](https://github.com/carbon-design-system/carbon-components-svelte/commit/54b7c65f34cf4fb816ebbaa2cce10503a5df13e3)), closes [#1836](https://github.com/carbon-design-system/carbon-components-svelte/issues/1836)
- **text-input:** wrap `value` prop description to one line ([7f7d32d](https://github.com/carbon-design-system/carbon-components-svelte/commit/7f7d32d42d79ea6532401befea89c9273806f1c0))
- **toggle:** dispatch change event for keyboard interactions ([#2217](https://github.com/carbon-design-system/carbon-components-svelte/issues/2217)) ([f38c305](https://github.com/carbon-design-system/carbon-components-svelte/commit/f38c305d9ed7a00da01445033834a80adabcb15f)), closes [#1611](https://github.com/carbon-design-system/carbon-components-svelte/issues/1611)
- **tooltip:** prevent closing on layout shift ([#2240](https://github.com/carbon-design-system/carbon-components-svelte/issues/2240)) ([1d0bc7e](https://github.com/carbon-design-system/carbon-components-svelte/commit/1d0bc7e697dad725fdef9af586cb8b6006764bf7)), closes [#925](https://github.com/carbon-design-system/carbon-components-svelte/issues/925)
- **ui-shell:** add `ariaLabelMenu` prop for hamburger menu ([#2212](https://github.com/carbon-design-system/carbon-components-svelte/issues/2212)) ([4b1f31f](https://github.com/carbon-design-system/carbon-components-svelte/commit/4b1f31f785cb200312508c7666fbb2546851bc7e)), closes [#1538](https://github.com/carbon-design-system/carbon-components-svelte/issues/1538)
- **ui-shell:** prevent focus on hidden links when `SideNav` is collapsed ([#2242](https://github.com/carbon-design-system/carbon-components-svelte/issues/2242)) ([08ca4ed](https://github.com/carbon-design-system/carbon-components-svelte/commit/08ca4eded77f73449fa405c6be7fd0aafa1b8724)), closes [#604](https://github.com/carbon-design-system/carbon-components-svelte/issues/604)

### [0.89.7](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.6...v0.89.7) (2025-09-05)

### Bug Fixes

- **combo-box:** address accessibility issues ([#2186](https://github.com/carbon-design-system/carbon-components-svelte/issues/2186)) ([2fc884c](https://github.com/carbon-design-system/carbon-components-svelte/commit/2fc884cacabfffcf7779d6ef9ba01dece0bf5d86)), closes [#2172](https://github.com/carbon-design-system/carbon-components-svelte/issues/2172)
- **data-table:** handle dynamic `headers` gracefully ([#2195](https://github.com/carbon-design-system/carbon-components-svelte/issues/2195)) ([6d0d3b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/6d0d3b108bb4595d878fda20736c40b9656d14d7)), closes [#2193](https://github.com/carbon-design-system/carbon-components-svelte/issues/2193)
- **overflow-menu:** avoid dynamic style injection for performance ([#2198](https://github.com/carbon-design-system/carbon-components-svelte/issues/2198)) ([14edf41](https://github.com/carbon-design-system/carbon-components-svelte/commit/14edf41e57fea1ddbb2cf24c37e79475849bdea1)), closes [#2197](https://github.com/carbon-design-system/carbon-components-svelte/issues/2197)
- **pagination:** `on:change` dispatches with correct value ([#2194](https://github.com/carbon-design-system/carbon-components-svelte/issues/2194)) ([44a6cc0](https://github.com/carbon-design-system/carbon-components-svelte/commit/44a6cc0dfcbd3cdad1b442a760c9f604e58d56e6))

### [0.89.6](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.5...v0.89.6) (2025-08-16)

### Bug Fixes

- **toggle:** avoid dispatching `toggle` event on state change ([#2184](https://github.com/carbon-design-system/carbon-components-svelte/issues/2184)) ([0df727b](https://github.com/carbon-design-system/carbon-components-svelte/commit/0df727b704d6cc577681dc682269a6e224ddbb6e))

### [0.89.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.4...v0.89.5) (2025-08-05)

### Bug Fixes

- **checkbox:** prevent infinite effect loop when binding to same object ([#2178](https://github.com/carbon-design-system/carbon-components-svelte/issues/2178)) ([c7ad1eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/c7ad1ebdd3764235f460abd95cdb7d1d389983d9)), closes [#2177](https://github.com/carbon-design-system/carbon-components-svelte/issues/2177)

### [0.89.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.3...v0.89.4) (2025-06-10)

### Bug Fixes

- **multi-select:** forward `on:input` for filterable variant ([#2170](https://github.com/carbon-design-system/carbon-components-svelte/issues/2170)) ([aecc4e8](https://github.com/carbon-design-system/carbon-components-svelte/commit/aecc4e8eec6571515233ec76ca06218814a279a7))

### [0.89.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.2...v0.89.3) (2025-06-07)

### Bug Fixes

- **combo-box:** "Escape" key clears input value ([#2169](https://github.com/carbon-design-system/carbon-components-svelte/issues/2169)) ([632320a](https://github.com/carbon-design-system/carbon-components-svelte/commit/632320ae3b8d9c602add0f4f7c708fc643cb7ffc)), closes [#2167](https://github.com/carbon-design-system/carbon-components-svelte/issues/2167)
- **combo-box:** clear button supports "Space" key ([#2168](https://github.com/carbon-design-system/carbon-components-svelte/issues/2168)) ([95c06a8](https://github.com/carbon-design-system/carbon-components-svelte/commit/95c06a83b3afcbb76acfc0a5efe2f178d333ff19)), closes [#2166](https://github.com/carbon-design-system/carbon-components-svelte/issues/2166)

### [0.89.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.1...v0.89.2) (2025-04-28)

### Bug Fixes

- **composed-modal:** ignore a11y warning in Svelte 5 ([#2159](https://github.com/carbon-design-system/carbon-components-svelte/issues/2159)) ([024d774](https://github.com/carbon-design-system/carbon-components-svelte/commit/024d77493c93e7823e4781a1a60aaf350d289d52))
- **pagination:** use `toLocaleString` for default text formatting ([#2161](https://github.com/carbon-design-system/carbon-components-svelte/issues/2161)) ([cdf5659](https://github.com/carbon-design-system/carbon-components-svelte/commit/cdf5659fa0177da77dc8ea1ccffdec54b746954b))
- **pagination:** window `totalItems` for performance ([#2160](https://github.com/carbon-design-system/carbon-components-svelte/issues/2160)) ([ed3928b](https://github.com/carbon-design-system/carbon-components-svelte/commit/ed3928bb01ecca2fa63f551938dbee1c1829a978)), closes [#2156](https://github.com/carbon-design-system/carbon-components-svelte/issues/2156)
- **to-hierarchy:** revert to previous implementation ([96d37cc](https://github.com/carbon-design-system/carbon-components-svelte/commit/96d37cc490f28830264c35c84447ee4526256314))

### [0.89.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.89.0...v0.89.1) (2025-04-21)

### Bug Fixes

- **toolbar-search:** re-filter rows if `DataTable` rows change ([#2154](https://github.com/carbon-design-system/carbon-components-svelte/issues/2154)) ([f09c2e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/f09c2e2c311c15f633db8dc45930d8e58a4b362d)), closes [#2143](https://github.com/carbon-design-system/carbon-components-svelte/issues/2143)

### [0.89.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.4...v0.89.0) (2025-04-18)

### Features

- **combo-box:** add `hideLabel` prop ([#2153](https://github.com/carbon-design-system/carbon-components-svelte/issues/2153)) ([436dea4](https://github.com/carbon-design-system/carbon-components-svelte/commit/436dea47e8da35753a257c9b2bd6f33338e95ba5))

### Bug Fixes

- **select:** falsy item `text` should fallback to `value` ([#2152](https://github.com/carbon-design-system/carbon-components-svelte/issues/2152)) ([61ea8dd](https://github.com/carbon-design-system/carbon-components-svelte/commit/61ea8dd82c2f9863dfe5f8a882e73624b994d9e5))

### [0.88.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.3...v0.88.4) (2025-03-24)

### Bug Fixes

- **list-box-selection:** fix `aria-label` for clear button ([#2134](https://github.com/carbon-design-system/carbon-components-svelte/issues/2134)) ([dd1338f](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd1338ffc47926a13e231d4a0f724e923f2219e2))
- **list-box:** correct button/description translations based on selection count ([#2139](https://github.com/carbon-design-system/carbon-components-svelte/issues/2139)) ([1a5f2d8](https://github.com/carbon-design-system/carbon-components-svelte/commit/1a5f2d8e67734bfda20272ae6a77d13b3837416d))
- **list-box:** set `aria-disabled` if `disabled` ([#2125](https://github.com/carbon-design-system/carbon-components-svelte/issues/2125)) ([#2138](https://github.com/carbon-design-system/carbon-components-svelte/issues/2138)) ([9b61af0](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b61af0306b422acf1e7cdde278e517740f667c5)), closes [#2130](https://github.com/carbon-design-system/carbon-components-svelte/issues/2130)
- **radio-button:** forward `focus`, `blur` events ([#2135](https://github.com/carbon-design-system/carbon-components-svelte/issues/2135)) ([1462e30](https://github.com/carbon-design-system/carbon-components-svelte/commit/1462e300d69f0cd7ee5476dfe3a7ea892ac8f4ad)), closes [#2131](https://github.com/carbon-design-system/carbon-components-svelte/issues/2131)
- **radio-tile:** allow standalone `RadioTile` usage ([#2136](https://github.com/carbon-design-system/carbon-components-svelte/issues/2136)) ([ca9beeb](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca9beebaeac7eaed8079c010a86a78926b00147f))
- **text-area:** allow visually hidden label ([#2137](https://github.com/carbon-design-system/carbon-components-svelte/issues/2137)) ([43511e0](https://github.com/carbon-design-system/carbon-components-svelte/commit/43511e09ecf312c1b8e9339856b9d7d0785036de))

### [0.88.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.2...v0.88.3) (2025-03-19)

### Bug Fixes

- Revert **list-box:** use `aria-disabled` instead of invalid `disabled` attribute ([#2125](https://github.com/carbon-design-system/carbon-components-svelte/issues/2125)) ([e1b3ef2](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1b3ef22c9ee09474bacadbb0b22b41326566bab))

### [0.88.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.1...v0.88.2) (2025-03-19)

### Bug Fixes

- **combo-box:** fix typing when refocusing input ([9e3d830](https://github.com/carbon-design-system/carbon-components-svelte/commit/9e3d83031e69889472c4e84be256ea242854cf81))
- **list-box:** use `aria-disabled` instead of invalid `disabled` attribute ([#2125](https://github.com/carbon-design-system/carbon-components-svelte/issues/2125)) ([e1b3ef2](https://github.com/carbon-design-system/carbon-components-svelte/commit/e1b3ef22c9ee09474bacadbb0b22b41326566bab))
- **multi-select:** fix keyboard navigation for disabled items ([#2129](https://github.com/carbon-design-system/carbon-components-svelte/issues/2129)) ([e7939ff](https://github.com/carbon-design-system/carbon-components-svelte/commit/e7939ff0e21c3430c9eea74c503b7c35f6823445)), closes [#2128](https://github.com/carbon-design-system/carbon-components-svelte/issues/2128)
- **notification:** remove invalid `kind` prop from markup ([#2126](https://github.com/carbon-design-system/carbon-components-svelte/issues/2126)) ([e85d7ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/e85d7efc5ed15f5236d074fd7981ae527d9e5ab5))
- **theme:** remove invalid `themes` prop from markup ([#2127](https://github.com/carbon-design-system/carbon-components-svelte/issues/2127)) ([5987b61](https://github.com/carbon-design-system/carbon-components-svelte/commit/5987b61a5522fff09468bddd586eed4a537edcc8))

### [0.88.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.88.0...v0.88.1) (2025-03-12)

### Bug Fixes

- **select:** falsy item `text` should not override `value` ([#2118](https://github.com/carbon-design-system/carbon-components-svelte/issues/2118)) ([663b79a](https://github.com/carbon-design-system/carbon-components-svelte/commit/663b79ad054d14a91a8bf700feb62dcf50976eb8)), closes [#2117](https://github.com/carbon-design-system/carbon-components-svelte/issues/2117)
- **ui-shell:** `HeaderAction` uses dark color scheme ([#2119](https://github.com/carbon-design-system/carbon-components-svelte/issues/2119)) ([7ff93ad](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ff93ad2dac489859d5b4a83c1e359a6507718b4))

### [0.88.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.7...v0.88.0) (2025-03-09)

### Features

- **data-table:** allow custom `inputName` for radio/checkbox ([#2087](https://github.com/carbon-design-system/carbon-components-svelte/issues/2087)) ([7481b9a](https://github.com/carbon-design-system/carbon-components-svelte/commit/7481b9a995dfbc8c2fbaeaae143c8372cf5fce66)), closes [#2085](https://github.com/carbon-design-system/carbon-components-svelte/issues/2085)
- **ui-shell:** `HeaderAction` supports tooltip ([#2111](https://github.com/carbon-design-system/carbon-components-svelte/issues/2111)) ([24b9cbc](https://github.com/carbon-design-system/carbon-components-svelte/commit/24b9cbc9c343537e5e74799ef8289bd29396cf04)), closes [#2110](https://github.com/carbon-design-system/carbon-components-svelte/issues/2110)

### [0.87.7](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.6...v0.87.7) (2025-03-07)

### Bug Fixes

- **select:** avoid infinite update loop in Svelte 5 ([#2108](https://github.com/carbon-design-system/carbon-components-svelte/issues/2108)) ([9b4bfa6](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b4bfa6f86e23155516db156cbe1c980f3c699e8)), closes [#2107](https://github.com/carbon-design-system/carbon-components-svelte/issues/2107)

### [0.87.6](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.5...v0.87.6) (2025-02-24)

### Bug Fixes

- **overflow-menu:** add `aria-controls` to trigger button ([#2100](https://github.com/carbon-design-system/carbon-components-svelte/issues/2100)) ([b7297d4](https://github.com/carbon-design-system/carbon-components-svelte/commit/b7297d452a7813c02f3c89280787292b1c46acec))

### [0.87.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.4...v0.87.5) (2025-02-04)

### Bug Fixes

- **tag:** allow `on:close` to work with Svelte 5 ([#2097](https://github.com/carbon-design-system/carbon-components-svelte/issues/2097)) ([6e65ef3](https://github.com/carbon-design-system/carbon-components-svelte/commit/6e65ef39e7ff9a3c0ee25b7945a62584e9b7441e)), closes [#2096](https://github.com/carbon-design-system/carbon-components-svelte/issues/2096)

### [0.87.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.3...v0.87.4) (2025-02-02)

### Bug Fixes

- **types:** loosen `icon` prop type to `any` ([#2095](https://github.com/carbon-design-system/carbon-components-svelte/issues/2095)) ([6bf72d4](https://github.com/carbon-design-system/carbon-components-svelte/commit/6bf72d46024ad2ce03651f28fc1a2a95ec03385d))

### [0.87.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.2...v0.87.3) (2025-01-30)

### Bug Fixes

- **overflow-menu:** support Svelte 5 ([88f4304](https://github.com/carbon-design-system/carbon-components-svelte/commit/88f4304d5a7c9b38b3cabda677233bef48fb9e3a)), closes [#2092](https://github.com/carbon-design-system/carbon-components-svelte/issues/2092)

### [0.87.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.1...v0.87.2) (2025-01-22)

### Bug Fixes

- **text-area:** counter supports null `value` ([#2089](https://github.com/carbon-design-system/carbon-components-svelte/issues/2089)) ([76eec84](https://github.com/carbon-design-system/carbon-components-svelte/commit/76eec84c5458d07d61d057d9ff06938e244dbb2c))

### [0.87.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.87.0...v0.87.1) (2025-01-19)

### Bug Fixes

- **data-table:** improve `expandable` accessibility ([#2086](https://github.com/carbon-design-system/carbon-components-svelte/issues/2086)) ([e874ac1](https://github.com/carbon-design-system/carbon-components-svelte/commit/e874ac19d778a00c0bba9be65d10be7e6c9104dd))
- **data-table:** prefix internal ID for radio button, checkbox ([#2082](https://github.com/carbon-design-system/carbon-components-svelte/issues/2082)) ([dd6cbac](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd6cbac3ee1728dbcba5cd1d8faa43941e2a198e)), closes [#2081](https://github.com/carbon-design-system/carbon-components-svelte/issues/2081)
- **dropdown:** avoid manual field `blur` ([c194c80](https://github.com/carbon-design-system/carbon-components-svelte/commit/c194c80e29ab36935af71adb9e166e9a16b70910)), closes [#2083](https://github.com/carbon-design-system/carbon-components-svelte/issues/2083)
- **multi-select:** avoid manual field `blur` ([fb6719b](https://github.com/carbon-design-system/carbon-components-svelte/commit/fb6719b1aee35aa45004d82e3b923b4ad45dff5d)), closes [#2083](https://github.com/carbon-design-system/carbon-components-svelte/issues/2083)

### [0.87.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.86.2...v0.87.0) (2024-12-09)

### Features

- add `toHierarchy` utility to normalize flat data into `nodes` for `TreeView`, `RecursiveList` ([#2072](https://github.com/carbon-design-system/carbon-components-svelte/issues/2072)) ([48afd18](https://github.com/carbon-design-system/carbon-components-svelte/commit/48afd18e5e01c2839024b8ddb31038267bcedeb8))

### Bug Fixes

- **tooltip-icon:** `button` should have explicit `type` ([#2071](https://github.com/carbon-design-system/carbon-components-svelte/issues/2071)) ([18c964e](https://github.com/carbon-design-system/carbon-components-svelte/commit/18c964e579a3762b8022751bf0ed5313b78b22ba))

### [0.86.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.86.1...v0.86.2) (2024-11-30)

### Bug Fixes

- **multi-select:** fix sorting behavior ([c3a390f](https://github.com/carbon-design-system/carbon-components-svelte/commit/c3a390f3fef072c6b736e33a85a2ae772df12e52)), closes [#2066](https://github.com/carbon-design-system/carbon-components-svelte/issues/2066)

## [0.86.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.86.0...v0.86.1) (2024-11-22)

### Bug Fixes

- **tree-view:** do not flatten original `nodes` ([#2056](https://github.com/carbon-design-system/carbon-components-svelte/issues/2056)) ([e488c88](https://github.com/carbon-design-system/carbon-components-svelte/commit/e488c8837146432330ebbf2f9182a8a69eab6b70))

## [0.86.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.4...v0.86.0) (2024-11-20)

### ⚠ BREAKING CHANGES

- **package:** set `type="module"` in `package.json`
- **package:** remove bundled ESM/UMD support
- **treeview:** rename `children` prop to `nodes` for Svelte 5 compatibility
- **recursive-list:** rename `children` prop to `nodes` for Svelte 5 compatibility
- **types:** use type alias instead of interface for exported component props ([6fbd8ae](https://github.com/carbon-design-system/carbon-components-svelte/commit/6fbd8ae6a90eabde74fb5481c980716eba477c31))

### Features

- **data-table:** support TypeScript generics ([#1954](https://github.com/carbon-design-system/carbon-components-svelte/issues/1954)) ([dd43224](https://github.com/carbon-design-system/carbon-components-svelte/commit/dd43224119905c3a26a2369f836338c18fcbafba))

### Bug Fixes

- **data-table:** (Svelte 5 compatibility) handle `ToolbarSearch` filtering in `DataTable` ([#2037](https://github.com/carbon-design-system/carbon-components-svelte/issues/2037)) ([3192824](https://github.com/carbon-design-system/carbon-components-svelte/commit/3192824322faef7c0c012eb246bb6ef9da7f78dc))
- **multi-select:** (Svelte 5 compatibility) avoid cyclic dependency ([#2034](https://github.com/carbon-design-system/carbon-components-svelte/issues/2034)) ([1acd713](https://github.com/carbon-design-system/carbon-components-svelte/commit/1acd7135372eeabf002dacc80e39162989427140))
- **toolbar-menu:** (Svelte 5 compatibility) remove redundant menu offset ([#2047](https://github.com/carbon-design-system/carbon-components-svelte/issues/2047)) ([7e17394](https://github.com/carbon-design-system/carbon-components-svelte/commit/7e173943ac783756521c4957a1c24b5288ab45b7)), closes [#2040](https://github.com/carbon-design-system/carbon-components-svelte/issues/2040)
- **checkbox:** (Svelte 5 compatibility) bind `indeterminate` ([#2044](https://github.com/carbon-design-system/carbon-components-svelte/issues/2044)) ([9d5e7e3](https://github.com/carbon-design-system/carbon-components-svelte/commit/9d5e7e31efb2d439b18ba0bf350b712377e160a7)), closes [#2039](https://github.com/carbon-design-system/carbon-components-svelte/issues/2039)

### [0.85.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.3...v0.85.4) (2024-11-09)

### Bug Fixes

- **combo-box:** fix types for `on:clear` ([#2020](https://github.com/carbon-design-system/carbon-components-svelte/issues/2020)) ([0831e87](https://github.com/carbon-design-system/carbon-components-svelte/commit/0831e871358fe012e9907699f1423b7e36dba0da))
- **data-table:** fix `DataTableValue` type reference in `DataTable` ([#2023](https://github.com/carbon-design-system/carbon-components-svelte/issues/2023)) ([44daa77](https://github.com/carbon-design-system/carbon-components-svelte/commit/44daa775d5e4dc9aef66eae0e661f14fb5b41354))
- **theme:** `Theme` correctly imports `toggle`, `select` props ([#2019](https://github.com/carbon-design-system/carbon-components-svelte/issues/2019)) ([49b5def](https://github.com/carbon-design-system/carbon-components-svelte/commit/49b5def8153f5eec523d56e2a2c6d4cc3a36dcb5)), closes [#2018](https://github.com/carbon-design-system/carbon-components-svelte/issues/2018)
- **toolbar-search:** fix types for `on:clear` ([#2022](https://github.com/carbon-design-system/carbon-components-svelte/issues/2022)) ([58e6021](https://github.com/carbon-design-system/carbon-components-svelte/commit/58e6021b08f311a5bb3cc7c7f181443cc633c8e4))
- **types:** delete extraneous `icons/Search.svelte.d.ts` ([#2025](https://github.com/carbon-design-system/carbon-components-svelte/issues/2025)) ([951d686](https://github.com/carbon-design-system/carbon-components-svelte/commit/951d6860423fc05df9f46e29fb19916b89c48466))
- **types:** fix types for `on:paste` event ([3167e44](https://github.com/carbon-design-system/carbon-components-svelte/commit/3167e449fdaf19abb4cdf1e2bf3f5bec24865f89))

### [0.85.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.2...v0.85.3) (2024-10-25)

### Bug Fixes

- address Svelte 5 warnings ([#2011](https://github.com/carbon-design-system/carbon-components-svelte/issues/2011)) ([43fccac](https://github.com/carbon-design-system/carbon-components-svelte/commit/43fccac1c6273d9aa83b8c26a5f8cecec667db59))

### [0.85.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.1...v0.85.2) (2024-08-14)

### Bug Fixes

- **header-action:** allow vertical scroll when expanded ([#1992](https://github.com/carbon-design-system/carbon-components-svelte/issues/1992)) ([61eceb0](https://github.com/carbon-design-system/carbon-components-svelte/commit/61eceb0caac20d92ce58c23d26908530a7e32dbe))

### [0.85.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.85.0...v0.85.1) (2024-08-09)

### Bug Fixes

- **multi-select:** fix `filterItem` return type ([#1972](https://github.com/carbon-design-system/carbon-components-svelte/issues/1972)) ([6140c3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/6140c3c5a91a879889be33080e1aa8b9183982d4))
- **search:** collapse expandable search if value is falsy ([#1987](https://github.com/carbon-design-system/carbon-components-svelte/issues/1987)) ([216d5a3](https://github.com/carbon-design-system/carbon-components-svelte/commit/216d5a39b14ddad600159c1159b6a2d38095cfaf)), closes [#1981](https://github.com/carbon-design-system/carbon-components-svelte/issues/1981)
- **text-area:** type `value` prop as nullable ([#1933](https://github.com/carbon-design-system/carbon-components-svelte/issues/1933)) ([47860ce](https://github.com/carbon-design-system/carbon-components-svelte/commit/47860ce1d7cc5f3b0363ab619dcfd74b3276eda7))

## [0.85.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.84.1...v0.85.0) (2024-03-23)

### ⚠ BREAKING CHANGES

- use `:global()` for custom UI Shell styles ([#1940](https://github.com/carbon-design-system/carbon-components-svelte/issues/1940)) ([d5a1148](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5a11489f8ab9dc05751aa20c420ea4dc6249567))

### [0.84.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.84.0...v0.84.1) (2024-03-16)

### Bug Fixes

- **checkbox:** forward `on:focus`, `on:blur` to `Checkbox` and `InlineCheckbox` ([#1937](https://github.com/carbon-design-system/carbon-components-svelte/issues/1937)) ([6364b23](https://github.com/carbon-design-system/carbon-components-svelte/commit/6364b23030cc0761aa6a0561a1673e89dde47868))
- **data-table:** loosen `sort` return type to be a `number` ([#1935](https://github.com/carbon-design-system/carbon-components-svelte/issues/1935)) ([9132bf8](https://github.com/carbon-design-system/carbon-components-svelte/commit/9132bf8e5a2d6ba70d17a0b4fcdea29d0785492c)), closes [#1934](https://github.com/carbon-design-system/carbon-components-svelte/issues/1934)

### [0.84.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.83.0...v0.84.0) (2024-03-08)

### Features

- **ui-shell:** support button tooltip in `HeaderGlobalAction` ([#1894](https://github.com/carbon-design-system/carbon-components-svelte/issues/1894)) ([d8bc651](https://github.com/carbon-design-system/carbon-components-svelte/commit/d8bc65163eabacfee348d6248e90f683ac488aef)), closes [#1893](https://github.com/carbon-design-system/carbon-components-svelte/issues/1893)

### Bug Fixes

- **exports:** resolve imports with explicit \*.js extension ([#1927](https://github.com/carbon-design-system/carbon-components-svelte/issues/1927)) ([0405ede](https://github.com/carbon-design-system/carbon-components-svelte/commit/0405edee7d1696a157acab941488f8d3a750187f)), closes [#1925](https://github.com/carbon-design-system/carbon-components-svelte/issues/1925)

## [0.83.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.11...v0.83.0) (2024-03-07)

### ⚠ BREAKING CHANGES

- **link:** do not render `p` for disabled link

### Bug Fixes

- avoid using reserved `$` for Svelte 5 compat ([a0d5028](https://github.com/carbon-design-system/carbon-components-svelte/commit/a0d5028540e1bcbb3b37bf488c11ea94f97b5fa7))
- **link:** do not render `p` for disabled link ([8bffc17](https://github.com/carbon-design-system/carbon-components-svelte/commit/8bffc17d650144ed0d5b778766f79c33334f0275)), closes [#1924](https://github.com/carbon-design-system/carbon-components-svelte/issues/1924)
- **search:** hoist ignore `a11y autofocus` comment ([6152b78](https://github.com/carbon-design-system/carbon-components-svelte/commit/6152b784c1e6b19ff242524e6b0c8c98b0107788))

### [0.82.11](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.10...v0.82.11) (2024-02-26)

### Bug Fixes

- **code-snippet:** `showMoreLess={false}` should hide button ([4085536](https://github.com/carbon-design-system/carbon-components-svelte/commit/40855361891c2388c2b775803bcac937fbd6c1d6)), closes [#1536](https://github.com/carbon-design-system/carbon-components-svelte/issues/1536)
- **image-loader:** updated `src` should update the image ([0f318aa](https://github.com/carbon-design-system/carbon-components-svelte/commit/0f318aac7732c2b94ec0729d54416611fbd0d493)), closes [#1677](https://github.com/carbon-design-system/carbon-components-svelte/issues/1677)
- **overflow-menu:** use `offsetWidth`, `offsetHeight` to compute menu dimensions ([#1913](https://github.com/carbon-design-system/carbon-components-svelte/issues/1913)) ([2404244](https://github.com/carbon-design-system/carbon-components-svelte/commit/24042442213ca9daa0cf663aabf37b3544e9c364))
- **toast-notification:** fire `on:clear` from timeout correctly ([9aabe3c](https://github.com/carbon-design-system/carbon-components-svelte/commit/9aabe3cbbb05712b71f5cad7c571b170c1f3a439)), closes [#1914](https://github.com/carbon-design-system/carbon-components-svelte/issues/1914)

### [0.82.10](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.9...v0.82.10) (2024-02-12)

### Bug Fixes

- **slider:** dispatch `on:input` event ([#1906](https://github.com/carbon-design-system/carbon-components-svelte/issues/1906)) ([90dbd15](https://github.com/carbon-design-system/carbon-components-svelte/commit/90dbd1562b04df3cf4de28874b6e790ddca1db81)), closes [#1643](https://github.com/carbon-design-system/carbon-components-svelte/issues/1643)

### [0.82.9](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.8...v0.82.9) (2024-02-07)

### Bug Fixes

- **context-menu:** prevent `on:contextmenu` default behavior only when opening menu ([#1911](https://github.com/carbon-design-system/carbon-components-svelte/issues/1911)) ([4ad522c](https://github.com/carbon-design-system/carbon-components-svelte/commit/4ad522c197d4a389a6187a499e9e54d5d8b3994a)), closes [#1909](https://github.com/carbon-design-system/carbon-components-svelte/issues/1909)
- **types:** improve `e.detail` type for dispatched events ([#1907](https://github.com/carbon-design-system/carbon-components-svelte/issues/1907)) ([6590457](https://github.com/carbon-design-system/carbon-components-svelte/commit/65904575743ba06344fb75e14685e42494c13cde))

### [0.82.8](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.7...v0.82.8) (2024-01-10)

### Bug Fixes

- **button:** forward `on:focus` event ([#1878](https://github.com/carbon-design-system/carbon-components-svelte/issues/1878)) ([5901872](https://github.com/carbon-design-system/carbon-components-svelte/commit/59018728df08db18ba85609e6db1c6dd8701d8bb)), closes [#1830](https://github.com/carbon-design-system/carbon-components-svelte/issues/1830)

### [0.82.7](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.6...v0.82.7) (2023-12-17)

### Bug Fixes

- **radio-button:** allow `value` type to be a number ([#1868](https://github.com/carbon-design-system/carbon-components-svelte/issues/1868)) ([4792257](https://github.com/carbon-design-system/carbon-components-svelte/commit/479225711a1e304df74f0cfc585e32b5454afd66))

### [0.82.6](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.5...v0.82.6) (2023-12-17)

### Bug Fixes

- **package:** include types in exports map ([#1865](https://github.com/carbon-design-system/carbon-components-svelte/issues/1865)) ([053beee](https://github.com/carbon-design-system/carbon-components-svelte/commit/053beeef7cbb1031f09798ffc360f8c87d17e3e1)), closes [#1863](https://github.com/carbon-design-system/carbon-components-svelte/issues/1863)

### [0.82.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.4...v0.82.5) (2023-12-16)

### Bug Fixes

- **header-search:** blur input when `active` is false ([#1857](https://github.com/carbon-design-system/carbon-components-svelte/issues/1857)) ([6c9cf9e](https://github.com/carbon-design-system/carbon-components-svelte/commit/6c9cf9e043b3c963a257a28fa8dd29c8acd4b2ce))
- **package.json:** add `exports` field to package.json to address Vite development warnings ([#1864](https://github.com/carbon-design-system/carbon-components-svelte/issues/1864)) ([7bef3fa](https://github.com/carbon-design-system/carbon-components-svelte/commit/7bef3fae6250607337306e95440b8a472638476f))

### [0.82.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.3...v0.82.4) (2023-11-21)

### Bug Fixes

- **header-search:** blur input when deactivating ([#1855](https://github.com/carbon-design-system/carbon-components-svelte/issues/1855)) ([192f6a7](https://github.com/carbon-design-system/carbon-components-svelte/commit/192f6a775c2a7da25e7fc4893efdc5a80b83928c))

### [0.82.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.2...v0.82.3) (2023-11-21)

### Bug Fixes

- **header-search:** "Escape" should close empty search bar ([#1853](https://github.com/carbon-design-system/carbon-components-svelte/issues/1853)) ([e667352](https://github.com/carbon-design-system/carbon-components-svelte/commit/e667352329651c25dc2d283eaa6cc8ca872040f6))

### [0.82.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.1...v0.82.2) (2023-11-20)

### Bug Fixes

- **header-search:** "Escape" should clear search query ([#1851](https://github.com/carbon-design-system/carbon-components-svelte/issues/1851)) ([6da4572](https://github.com/carbon-design-system/carbon-components-svelte/commit/6da4572c2672e02a6463ee8374fd341868512034))
- **header-search:** vertically center button icons ([#1850](https://github.com/carbon-design-system/carbon-components-svelte/issues/1850)) ([d68dc18](https://github.com/carbon-design-system/carbon-components-svelte/commit/d68dc182668dc0b56481d4646d672591cd7fc3e3))

### [0.82.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.82.0...v0.82.1) (2023-11-18)

### Bug Fixes

- **pagination-nav:** set `button type="button"` to prevent form submission ([#1846](https://github.com/carbon-design-system/carbon-components-svelte/issues/1846)) ([bed073c](https://github.com/carbon-design-system/carbon-components-svelte/commit/bed073c2f707392d3fe7d75fbf4550e723b93605))

### [0.82.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.81.3...v0.82.0) (2023-11-13)

### Features

- **tree-view:** add `showNode` accessor ([#1844](https://github.com/carbon-design-system/carbon-components-svelte/issues/1844)) ([1ad4e3d](https://github.com/carbon-design-system/carbon-components-svelte/commit/1ad4e3d3856e07fb1808f34b8c48dfc6a8a5e7d8)), closes [#1377](https://github.com/carbon-design-system/carbon-components-svelte/issues/1377)
- **tree-view:** make `node` slottable ([#1843](https://github.com/carbon-design-system/carbon-components-svelte/issues/1843)) ([6a55fef](https://github.com/carbon-design-system/carbon-components-svelte/commit/6a55fef62e095114a1782d1079501e9e940cca94)), closes [#1660](https://github.com/carbon-design-system/carbon-components-svelte/issues/1660)

### [0.81.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.81.2...v0.81.3) (2023-11-08)

### Bug Fixes

- **select-item:** export `class` and `style` props ([#1840](https://github.com/carbon-design-system/carbon-components-svelte/issues/1840)) ([a9460e9](https://github.com/carbon-design-system/carbon-components-svelte/commit/a9460e944de9ae967664a75df842f4bdc909067f)), closes [#1839](https://github.com/carbon-design-system/carbon-components-svelte/issues/1839)

### [0.81.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.81.1...v0.81.2) (2023-10-27)

### Bug Fixes

- **multi-select:** render checkboxes for form data ([#1835](https://github.com/carbon-design-system/carbon-components-svelte/issues/1835)) ([7ba52df](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ba52df3a1ee89b06377a0b4888cce27cc89196f)), closes [#1742](https://github.com/carbon-design-system/carbon-components-svelte/issues/1742)

### [0.81.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.81.0...v0.81.1) (2023-10-23)

### Bug Fixes

- **multi-select:** reset `selectedIds` when clearing selection ([#1832](https://github.com/carbon-design-system/carbon-components-svelte/issues/1832)) ([e3ab471](https://github.com/carbon-design-system/carbon-components-svelte/commit/e3ab471018b9ac94ff9de2284284dc61ba69c881)), closes [#1831](https://github.com/carbon-design-system/carbon-components-svelte/issues/1831)

### [0.81.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.80.0...v0.81.0) (2023-10-13)

### Features

- **data-table:** pass `row` to `display` function ([#1810](https://github.com/carbon-design-system/carbon-components-svelte/issues/1810)) ([9456eaa](https://github.com/carbon-design-system/carbon-components-svelte/commit/9456eaab3ce5259d8f6dcaa7b3db9058d3555aa6))
- **deps-dev:** upgrade `carbon-components` to 10.58 ([#1828](https://github.com/carbon-design-system/carbon-components-svelte/issues/1828)) ([519bd86](https://github.com/carbon-design-system/carbon-components-svelte/commit/519bd8616a4fe16af4befb6a1159e62f42d9651c))

### Bug Fixes

- **file-uploader-button:** clear value by setting to `""` instead of `null` ([#1812](https://github.com/carbon-design-system/carbon-components-svelte/issues/1812)) ([108eb52](https://github.com/carbon-design-system/carbon-components-svelte/commit/108eb5286c46bd17a54ccbda31ee95f16a16763e))
- **radio-button-group:** add `name` and `required` props ([#1037](https://github.com/carbon-design-system/carbon-components-svelte/issues/1037)) ([24e2a88](https://github.com/carbon-design-system/carbon-components-svelte/commit/24e2a8874f5d0c39f88761c3f118ba71aab27c1d)), closes [#1036](https://github.com/carbon-design-system/carbon-components-svelte/issues/1036)
- **radio-button-group:** strongly type dispatched change/select events ([#1819](https://github.com/carbon-design-system/carbon-components-svelte/issues/1819)) ([06d81dd](https://github.com/carbon-design-system/carbon-components-svelte/commit/06d81ddbff8a6170d34ca1e94a41c16d318ec7ca))
- **tile-group:** add `name` and `required` props ([#1818](https://github.com/carbon-design-system/carbon-components-svelte/issues/1818)) ([836b360](https://github.com/carbon-design-system/carbon-components-svelte/commit/836b360b9b7402cb3cd44489fd5f14b8c901f9f2))

### [0.80.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.79.0...v0.80.0) (2023-08-26)

### Features

- **ui-shell:** forward `click` event to `HeaderActionLink` ([#1797](https://github.com/carbon-design-system/carbon-components-svelte/issues/1797)) ([e5675eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/e5675eb203db51de736b24f41694f5b020f9aafc)), closes [#1796](https://github.com/carbon-design-system/carbon-components-svelte/issues/1796)

### Bug Fixes

- **skeleton-text:** fix reactivity in `paragraph` variant ([#1794](https://github.com/carbon-design-system/carbon-components-svelte/issues/1794)) ([bc97ce5](https://github.com/carbon-design-system/carbon-components-svelte/commit/bc97ce5e1b69669d17f3ad13aaeb774b05c09c80)), closes [#1793](https://github.com/carbon-design-system/carbon-components-svelte/issues/1793)

## [0.79.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.78.0...v0.79.0) (2023-07-24)

### ⚠ BREAKING CHANGES

- **loading:** remove `id` prop from `Loading` (#1783)

### Features

- **file-uploader-button:** support `danger-tertiary`, `danger-ghost` button variants ([#1784](https://github.com/carbon-design-system/carbon-components-svelte/issues/1784)) ([709322c](https://github.com/carbon-design-system/carbon-components-svelte/commit/709322c2819e3123ade4a13e3fd7d05035154d6b))
- **file-uploader:** add `size` prop to `FileUploaderButton` ([#1786](https://github.com/carbon-design-system/carbon-components-svelte/issues/1786)) ([51c281d](https://github.com/carbon-design-system/carbon-components-svelte/commit/51c281de4a29b99e61952959a8cbfdba0b49e786))
- **file-uploader:** make `labelTitle`, `labelDescription` slottable ([#1780](https://github.com/carbon-design-system/carbon-components-svelte/issues/1780)) ([239f1b1](https://github.com/carbon-design-system/carbon-components-svelte/commit/239f1b10e562507f66e3cd318084ed1de30f0c25))
- **slider:** add `hideLabel` prop ([#1777](https://github.com/carbon-design-system/carbon-components-svelte/issues/1777)) ([baff07e](https://github.com/carbon-design-system/carbon-components-svelte/commit/baff07e012b43e1a24b2e574a57509f711a463f6)), closes [#1682](https://github.com/carbon-design-system/carbon-components-svelte/issues/1682)

### Bug Fixes

- **file-uploader:** do not render empty element if `labelTitle`, `labelDescription` not provided ([#1778](https://github.com/carbon-design-system/carbon-components-svelte/issues/1778)) ([7ef8b73](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ef8b73252709130c8e269b83b2936e1631c96fa)), closes [#1775](https://github.com/carbon-design-system/carbon-components-svelte/issues/1775)
- **loading:** remove redundant `description` label ([#1783](https://github.com/carbon-design-system/carbon-components-svelte/issues/1783)) ([d6804b4](https://github.com/carbon-design-system/carbon-components-svelte/commit/d6804b44fea0d4fc23574e63e7d4c64fa18e8f42)), closes [#1670](https://github.com/carbon-design-system/carbon-components-svelte/issues/1670)
- **types:** correctly type `kind` prop in `FileUploader`, `FileUploaderButton` ([#1781](https://github.com/carbon-design-system/carbon-components-svelte/issues/1781)) ([a7443c2](https://github.com/carbon-design-system/carbon-components-svelte/commit/a7443c2dca396f79e06fed695374c0a15bda14ed))
- **types:** improve formatting of prop comments ([#1779](https://github.com/carbon-design-system/carbon-components-svelte/issues/1779)) ([be76370](https://github.com/carbon-design-system/carbon-components-svelte/commit/be763706ca7ab0182bc0f8171e74043ccbadf461))

## [0.78.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.77.0...v0.78.0) (2023-07-19)

### ⚠ BREAKING CHANGES

- **typescript:** minimum Svelte version for TypeScript users is 3.55

### Features

- **typescript:** support svelte 4 ([#1773](https://github.com/carbon-design-system/carbon-components-svelte/issues/1773)) ([2f026f7](https://github.com/carbon-design-system/carbon-components-svelte/commit/2f026f792ad94f468b890a6d5ab36cc2642dacf2)), closes [#1753](https://github.com/carbon-design-system/carbon-components-svelte/issues/1753)

## [0.77.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.76.1...v0.77.0) (2023-07-13)

### Features

- **ui-shell:** add `preventCloseOnClickOutside` to `HeaderAction` ([#1625](https://github.com/carbon-design-system/carbon-components-svelte/issues/1625)) ([ea9b261](https://github.com/carbon-design-system/carbon-components-svelte/commit/ea9b261b60698f9314e0aae4d61025bae215cccf)), closes [#1624](https://github.com/carbon-design-system/carbon-components-svelte/issues/1624)
- **ui-shell:** make `company` in `Header` slottable ([#1764](https://github.com/carbon-design-system/carbon-components-svelte/issues/1764)) ([9b3f014](https://github.com/carbon-design-system/carbon-components-svelte/commit/9b3f014a0ba43abb5a36be4a6156910b5d7644d7))

### [0.76.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.76.0...v0.76.1) (2023-07-08)

### Bug Fixes

- **date-picker:** hide `helperText` if invalid or warning state ([#1759](https://github.com/carbon-design-system/carbon-components-svelte/issues/1759)) ([d5a4a8b](https://github.com/carbon-design-system/carbon-components-svelte/commit/d5a4a8b94a8753545a54f7e43f1773e49a1ff208))
- **select:** hide `helperText` if invalid or warning state ([#1761](https://github.com/carbon-design-system/carbon-components-svelte/issues/1761)) ([7579c03](https://github.com/carbon-design-system/carbon-components-svelte/commit/7579c032faa3f1b9ad9d42f76da876f38725141e))
- **slider:** `disabled` Slider should not submit a form ([#1758](https://github.com/carbon-design-system/carbon-components-svelte/issues/1758)) ([ab21c89](https://github.com/carbon-design-system/carbon-components-svelte/commit/ab21c89ab9240f61bd15d8c20bad65b3b469a29c))
- **types:** allow `data-*` attributes for props forwarded to HTML elements ([#1741](https://github.com/carbon-design-system/carbon-components-svelte/issues/1741)) ([7fdc2ef](https://github.com/carbon-design-system/carbon-components-svelte/commit/7fdc2ef7f072382842cbb6bfc8e12e083aef1a1e))

### [0.76.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.75.1...v0.75.2) (2023-06-21)

### Features

- make `titleText` slottable in `MultiSelect`, `ComboBox` ([#1750](https://github.com/carbon-design-system/carbon-components-svelte/issues/1750)) ([0b4f19c](https://github.com/carbon-design-system/carbon-components-svelte/commit/0b4f19c87e8479f0649fa2c5dc84beb4c1a1e302)), closes [#1747](https://github.com/carbon-design-system/carbon-components-svelte/issues/1747)

### [0.75.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.75.0...v0.75.1) (2023-06-02)

### Bug Fixes

- **expandable-tile:** set tile height using resize observer ([#1738](https://github.com/carbon-design-system/carbon-components-svelte/issues/1738)) ([a369962](https://github.com/carbon-design-system/carbon-components-svelte/commit/a369962fdf96f95bbdcc2f8f9f84c5d900ec4087))

### [0.75.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.74.0...v0.74.1) (2023-05-21)

### Features

- **pagination-nav:** add `tooltipPosition` prop ([#1733](https://github.com/carbon-design-system/carbon-components-svelte/issues/1733)) ([60a796e](https://github.com/carbon-design-system/carbon-components-svelte/commit/60a796ea48b17a4e8829b8782aaddb569534c7c4)), closes [#1656](https://github.com/carbon-design-system/carbon-components-svelte/issues/1656)

### [0.74.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.5...v0.74.0) (2023-05-18)

### Features

- **ui-shell:** make `HeaderNavItem` slottable ([#1693](https://github.com/carbon-design-system/carbon-components-svelte/issues/1693)) ([b9aaa3a](https://github.com/carbon-design-system/carbon-components-svelte/commit/b9aaa3adcaf87e34ac3d45a2e39f1db92ebe1b33))

### Bug Fixes

- resolve `a11y` warnings from Svelte version 3.58 ([#1732](https://github.com/carbon-design-system/carbon-components-svelte/issues/1732)) ([c02b473](https://github.com/carbon-design-system/carbon-components-svelte/commit/c02b4738bce612359148267c79450c6650bf68d3))

### [0.73.5](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.4...v0.73.5) (2023-03-26)

### [0.73.4](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.3...v0.73.4) (2023-03-21)

### Bug Fixes

- **selectable-tile:** include dispatched events in types ([#1695](https://github.com/carbon-design-system/carbon-components-svelte/issues/1695)) ([ca40dd1](https://github.com/carbon-design-system/carbon-components-svelte/commit/ca40dd18c2af1bc755b857c39469427038f20ece)), closes [#1694](https://github.com/carbon-design-system/carbon-components-svelte/issues/1694)
- **text-input:** correctly set input padding for warning state ([#1688](https://github.com/carbon-design-system/carbon-components-svelte/issues/1688)) ([821233a](https://github.com/carbon-design-system/carbon-components-svelte/commit/821233ab4f0bf247dea6a8aa32b79d15424ff059)), closes [#1687](https://github.com/carbon-design-system/carbon-components-svelte/issues/1687)

### [0.73.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.2...v0.73.3) (2023-03-11)

### Bug Fixes

- **1684:** hide helper text container in password input when not used ([#1685](https://github.com/carbon-design-system/carbon-components-svelte/issues/1685)) ([42349eb](https://github.com/carbon-design-system/carbon-components-svelte/commit/42349ebc61fdc8756fc5209d4cb63f4f9a63dce9))

### [0.73.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.1...v0.73.2) (2023-02-27)

### Bug Fixes

- `readonly` should override `error` behavior in `TextInput`, `NumberInput` ([#1666](https://github.com/carbon-design-system/carbon-components-svelte/issues/1666)) ([6386c33](https://github.com/carbon-design-system/carbon-components-svelte/commit/6386c33f939b5fa310e8eb5a51412c6151de75d2)), closes [/github.com/carbon-design-system/carbon-components-svelte/pull/1666#pullrequestreview-1314558645](https://github.com/carbon-design-system//github.com/carbon-design-system/carbon-components-svelte/pull/1666/issues/pullrequestreview-1314558645)

### [0.73.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.73.0...v0.73.1) (2023-02-19)

### Bug Fixes

- **textinput/passwordinput:** apply aria-describedby to hint text ([b435be4](https://github.com/carbon-design-system/carbon-components-svelte/commit/b435be4f1221b30c9afd7a9e1c6867b38eeadeaa)), closes [#1633](https://github.com/carbon-design-system/carbon-components-svelte/issues/1633)

### [0.73.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.72.3...v0.73.0) (2023-02-19)

### Features

- **progress-bar:** add `status` prop ([#1560](https://github.com/carbon-design-system/carbon-components-svelte/issues/1560)) ([7ddbf17](https://github.com/carbon-design-system/carbon-components-svelte/commit/7ddbf17cbb82bd78256037af8028ea20b9c35d5a))

### [0.72.3](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.72.2...v0.72.3) (2023-02-11)

### Bug Fixes

- **types:** add missing `$$restProps` for `Checkbox`, `Filename`, `FluidForm` ([#1655](https://github.com/carbon-design-system/carbon-components-svelte/issues/1655)) ([6450e8b](https://github.com/carbon-design-system/carbon-components-svelte/commit/6450e8b0b17e1538043f131d64e2d1fc667c95a8))

### [0.72.2](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.72.1...v0.72.2) (2023-02-05)

### Bug Fixes

- **dropdown:** dispatch correct `selectedItem` in `select` event ([#1646](https://github.com/carbon-design-system/carbon-components-svelte/issues/1646)) ([d897484](https://github.com/carbon-design-system/carbon-components-svelte/commit/d897484abfcc8be351ac87b0f0bb49900f4b4b1d)), closes [#1645](https://github.com/carbon-design-system/carbon-components-svelte/issues/1645)

### [0.72.1](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.72.0...v0.72.1) (2023-01-25)

### Bug Fixes

- **dropdown:** fix ssr issue ([#1639](https://github.com/carbon-design-system/carbon-components-svelte/issues/1639)) ([8cb5d53](https://github.com/carbon-design-system/carbon-components-svelte/commit/8cb5d538f7ad10d7c93e10c04f01d2c77b4eba44)), closes [#1638](https://github.com/carbon-design-system/carbon-components-svelte/issues/1638)

## [0.72.0](https://github.com/carbon-design-system/carbon-components-svelte/compare/v0.71.0...v0.72.0) (2023-01-18)

### ⚠ BREAKING CHANGES

- **tree-view:** remove `expanded` property from `TreeNode` interface (#1631)

### Bug Fixes

- **dropdown:** close when user clicks outside iframe ([#1596](https://github.com/carbon-design-system/carbon-components-svelte/issues/1596)) ([73aa6e2](https://github.com/carbon-design-system/carbon-components-svelte/commit/73aa6e216aa99df3b0b3186398e6466db523cf88)), closes [#1595](https://github.com/carbon-design-system/carbon-components-svelte/issues/1595)
- **tree-view:** remove `expanded` property from `TreeNode` interface ([#1631](https://github.com/carbon-design-system/carbon-components-svelte/issues/1631)) ([ec867c4](https://github.com/carbon-design-system/carbon-components-svelte/commit/ec867c46ba7adce02938d6516557d3312591fa5f)), closes [#1630](https://github.com/carbon-design-system/carbon-components-svelte/issues/1630)

## [0.71.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.71.0) - 2022-12-31

**Breaking Changes**

- `Select`: rename dispatched `change` event to `update`
- `Select`: forward `change` event
- `PaginationNav`: use 1-indexing to be consistent with `Pagination`
- `InlineNotification`: remove `iconDescription` prop (replaced with `closeButtonDescription` and `statusIconDescription`)

**Features**

- `Pagination`: dispatch `change` event when user interacts with previous/next buttons, or page/page size dropdowns
- `InlineNotification`: add `iconDescription` and `closeButtonDescription` props

**Documentation**

- link 'source code' to folder for multiple components
- `PaginationNav`: add description for `change` event

## [0.70.13](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.13) - 2022-12-08

**Fixes**

- support `NumberInput` incrementing/decrementing floating point values
- allow arrow keys to open and navigate `Dropdown` menu
- only fire `Dropdown` "select" event on interaction
- avoid runtime error if `Dropdown` items is an empty array
- avoid runtime error if `MultiSelect` items is an empty array
- avoid runtime error if `ComboBox` items is an empty array
- fire `OverflowMenu` "close" event when clicking outside menu
- fire `Popover` "click:outside" event when clicking sibling elements
- forward `Toggle` "change" and "keyup" events after `toggled` updates
- fix `ProgressStep` label text if `vertical`
- make `ProgressStep` inherit unclickable styles if `preventChangeOnClick`
- add explicit `type="button"` to `TableHeader` button
- add explicit `type="button"` to `ProgressStep` button
- loosen `TreeView` text prop type from `string` to `any`
- make `TreeView` children prop type work recursively
- remove unused `derived` import from `DataTable`

## [0.70.12](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.12) - 2022-10-13

**Fixes**

- `Search` prop types should extend `input` attributes

## [0.70.11](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.11) - 2022-10-13

**Fixes**

- ignore false positive a11y warnings from Svelte version 3.51
- `NumberInput` with `allowInput` should not be invalid if `value` is `null`

## [0.70.10](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.10) - 2022-10-04

**Fixes**

- avoid element reference error in `ListBoxMenuItem`
- display warn/invalid icons in `DatePickerInput` with calendar
- fix layout regression in `HeaderSearch`
- localize `HeaderAction`, `ImageLoader` transitions

## [0.70.9](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.9) - 2022-09-23

**Fixes**

- fix visual regression in next/previous buttons in `Pagination`, `PaginationNav`

## [0.70.8](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.8) - 2022-09-21

**Fixes**

- forward keyup, keydown, paste events in `ToolbarSearch` to `Search`

## [0.70.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.7) - 2022-09-17

**Fixes**

- prevent `submit` event on `Modal` if primary button is disabled

## [0.70.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.6) - 2022-09-05

**Fixes**

- resolve `Toggle`, `HeaderSearch` accessibility warnings in Svelte >=v3.50

## [0.70.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.5) - 2022-09-02

**Fixes**

- avoid left margin style if `Button` is icon-only

## [0.70.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.4) - 2022-08-31

**Fixes**

- correctly scroll item into view when keyboard navigating `Dropdown`, `ComboBox`, `MultiSelect`

## [0.70.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.3) - 2022-08-31

**Fixes**

- close menu in `Dropdown`, `MultiSelect` when pressing "Escape"
- prevent default behavior in `ComboBox` when pressing "Enter," "ArrowUp," or "ArrowDown"
- scroll item into view when keyboard navigating `Dropdown`, `ComboBox`, `MultiSelect`

## [0.70.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.2) - 2022-08-29

**Fixes**

- allow `$$restProps.style` to be correctly set on `Content`

## [0.70.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.1) - 2022-08-23

**Fixes**

- do not unset `Content` left margin for rail `SideNav`
- set `role`, `aria-label` attributes on `DatePicker` calendar container

## [0.70.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.70.0) - 2022-08-18

**Features**

- add `filteredRowIds` prop to `ToolbarSearch` to support pagination

## [0.69.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.69.0) - 2022-08-17

**Features**

- dispatch `on:click:header--select` event in `DataTable`
- dispatch `on:click:row--select` event in `DataTable`

## [0.68.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.68.0) - 2022-08-15

**Features**

- add `fullWidth` prop to `ToastNotification`
- dispatch cancelable `on:cancel` event in `ToolbarBatchActions`
- add `active` prop to `ToolbarBatchActions`

**Documentation**

- add `ToastNotification` example "Full width"
- add `DataTable` example "Batch selection with controlled toolbar"

## [0.67.9](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.9) - 2022-08-11

**Fixes**

- `NotificationActionButton` types should extend `Button` props

## [0.67.8](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.8) - 2022-08-10

**Fixes**

- remove `aria-checked="mixed"` if `InlineCheckbox` is indeterminate
- add `aria-labelledby` to `Slider` thumb
- add `role="switch"` to `Toggle` input

## [0.67.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.7) - 2022-08-07

**Fixes**

- remove UI Shell `Content` left margin if `SideNav` is collapsed

## [0.67.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.6) - 2022-08-05

**Refactor**

- use class directive in `TextInput`, `DatePickerInput`

**Fixes**

- avoid dynamic class names in `NotificationButton`, `NotificationIcon`
- forward keydown, keyup events to `NumberInput`

## [0.67.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.5) - 2022-08-04

**Fixes**

- correctly select a `ComboBox` item when pressing "Enter"

## [0.67.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.4) - 2022-07-26

**Fixes**

- override `Toggle` margin-top style if `hideLabel` is true

## [0.67.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.3) - 2022-07-26

**Fixes**

- correctly pluralize `Pagination` items display text
- prevent label text selection in `Toggle`
- add missing `hideLabel` prop to `Toggle`

## [0.67.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.2) - 2022-07-23

**Fixes**

- display correct `ComboBox` value if using `itemToString` and `shouldFilterItem` props

## [0.67.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.1) - 2022-07-12

**Fixes**

- set a high `z-index` on the `SideNav` overlay to avoid it being covered by other elements

## [0.67.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.67.0) - 2022-06-29

**Breaking Changes**

Svelte version >=3.48.0 is required.

- re-revert [924b6d35](924b6d352eebf5c82da63f0ead450dc59e80ca30) to allow close event in `ToastNotification`, `InlineNotification` to be cancellable

## [0.66.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.66.3) - 2022-06-29

**Fixes**

- revert [924b6d35](924b6d352eebf5c82da63f0ead450dc59e80ca30) and re-publish since v0.66.2 contains breaking changes

## [0.66.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.66.2) - 2022-06-29

**Fixes**

- allow close event in `ToastNotification`, `InlineNotification` to be cancellable

**Documentation**

- add `ToastNotification` example "Prevent default close behavior"
- add `InlineNotification` example "Prevent default close behavior"

## [0.66.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.66.1) - 2022-06-27

**Fixes**

- support `PasswordInput` invalid state when used in a `FluidForm`
- remove title attribute from `SideNavMenu` icon
- remove tabindex attribute from `SideNavMenu` icon
- override max-height in an expanded `SideNavMenu`
- fix `ComposedModal` type error where the focus node is possibly `null`

**Refactor**

- pass required `text` prop from `CodeSnippet` to `CopyButton` to prevent development warning

**Documentation**

- add `PasswordInput` example "Invalid state"
- rename `ComboBox` example "Selected id" to "Initial selected id"
- revise `DatePicker` example "DatePicker in a modal" to prevent iframe from stealing focus

## [0.66.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.66.0) - 2022-06-18

**Features**

- add `fullWidth` prop to `Slider`
- support number type for `selected` prop in `Select`

**Fixes**

- only dispatch "change" in `Select` if `selected` value has changed
- use first `SelectItem` value as default `selected` value in `Select` if `undefined`

**Documentation**

- add `Slider` example "Full width"
- revise `Select` example "Default" to demo usage without `selected` prop

## [0.65.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.65.3) - 2022-06-15

**Fixes**

- fix `TreeView` type error when keyboard navigating an expanded node

## [0.65.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.65.2) - 2022-06-12

**Fixes**

- `DataTable` header keys should be reactive
- use native binding for value prop in `TimePicker`
- use native binding for value prop in `ComboBox`, `MultiSelect`

## [0.65.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.65.1) - 2022-06-09

**Fixes**

- `DataTable` column sort direction order should be independent

## [0.65.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.65.0) - 2022-06-07

**Breaking Changes**

- mark array-type props as read-only

**Features**

- add `sortKey`, `sortDirection` props to `DataTable` for programmatic sorting
- forward `paste` event to `ComboBox`, `DatePicker`, `MultiSelect`, `NumberInput`, `Search`, `TextArea`, `TextInput`, `PasswordInput`, `TimePicker`, `HeaderSearch`
- support disabled items in `Dropdown`, `MultiSelect`, `ComboBox`

**Fixes**

- do not overwrite `cells` property in `rows` object in `DataTable`
- correctly toggle the body class if using nested modals
- remove useless `inline` prop from `Dropdown`
- remove redundant `Dropdown` list box role and id
- add missing `role="option"` and `aria-selected` attributes to `ListBoxMenuItem`

**Refactor**

- set alert `Modal` attributes in markup instead of script

**Documentation**

- add `DataTable` example "Programmatic sorting"
- add `Modal` example "Has scrolling content"
- add `Modal` example "Custom focus"
- add `Dropdown` example "Disabled items"
- add `MultiSelect` example "Disabled items"
- add `ComboBox` example "Disabled items"

## [0.64.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.64.3) - 2022-05-29

**Fixes**

- active tab in `Tabs` should not steal focus if programmatically selected
- set title attribute in `CheckBox`, `MultiSelect`, `Dropdown`, `ComboBox` if label is truncated

**Refactor**

- refactor components to use `class:` directive instead of the class attribute

**Documentation**

- add `Tabs` example "Disabled tabs"

## [0.64.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.64.2) - 2022-05-25

**Fixes**

- apply custom `DataTable` widths to empty columns

## [0.64.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.64.1) - 2022-05-23

**Fixes**

- mark `CopyButton` text prop as required
- mark `Dropdown` selectedId prop as required
- use `@see` tag in `Theme` tokens prop description
- remove `title` attribute from `Modal`, `ModalHeader` close button
- remove redundant `aria-label` from `Modal` close button icon
- add `aria-hidden="true"` to `Modal`, `ModalHeader` close button icon

**Documentation**

- update `Theme` docs to specify that it must be used with `all.css`
- update `DataTable` docs to note that custom widths do not work with `stickyHeader`

## [0.64.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.64.0) - 2022-05-14

**Breaking Changes**

- set `flatpickrProps.static` in `DatePicker` to be true by default
- use data attribute instead of id for `DataTable` headers/rows

**Features**

- support custom column widths in `DataTable`
- dispatch "expand" and "collapse" events in `CodeSnippet`

**Fixes**

- use `@see` tag for flatpickr options link in `DatePicker`
- pressing "Enter" in `DatePicker` should update the value
- dispatched event type without detail should be `null`, not `any`
- type missing "open" event in `HeaderAction`
- use small button in multi-line `CodeSnippet`

**Documentation**

- make calendar variants of `DatePicker` more prominent
- add `DataTable` example "Custom column widths"
- add `CodeSnippet` examples "Expanded by default" and "Reactive example"

## [0.63.8](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.8) - 2022-05-07

**Fixes**

- elevate `Toolbar` z-index so overflow menu is not clipped by the table

## [0.63.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.7) - 2022-05-04

**Fixes**

- strongly type `translateWithId` prop in `Dropdown`

## [0.63.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.6) - 2022-05-04

**Fixes**

- add `translateWithIdsSelection` prop to `ComboBox`, `MultiSelect` to customize clear selection description
- use default values in `ListBoxMenuIcon` if `translateWithIds` is undefined
- use default values in `ListBoxSelection` if `translateWithIds` is undefined

## [0.63.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.5) - 2022-05-02

**Fixes**

- dispatch "change" event in `Tabs` only if selected index has changed

## [0.63.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.4) - 2022-04-30

**Fixes**

- add missing `"2x3"` ratio value to `AspectRatio`
- fix typo in `ToolbarSearch` shouldFilterRows type annotation

**Documentation**

- correctly generate icon, action imports in examples
- remove unnecessary `tooltipBodyId` in `Tooltip` examples
- add `DataTable` "Expandable and selectable" example
- add `DataTable` "Batch selection" example

## [0.63.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.3) - 2022-04-28

**Fixes**

- fix `FileUploaderItem` regression where `delete` event should be dispatched if status is "edit"

**Documentation**

- add `FileUploader` "Item (edit)" example
- revise `FileUploader` "Item (edit status, invalid state)" example to include `on:delete` usage
- add `FileUploader` "Item (edit status, invalid state with subject, body)" example

## [0.63.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.2) - 2022-04-23

**Fixes**

- set `type="button"` on `Dropdown` to fix usage in a form
- re-focus search bar when clearing `ToolbarSearch` value

## [0.63.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.1) - 2022-04-18

**Fixes**

- `HeaderGlobalAction` icon size should be `20` by default
- fix `rows` reactivity in `DataTable`

## [0.63.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.63.0) - 2022-04-17

**Breaking Changes**

- remove deprecated components: `Icon`, `IconSkeleton`, `NotificationTextDetails`, `ToggleSmall`, `ToggleSmallSkeleton`, `HeaderActionSearch`
- remove deprecated component props
- remove `optimizeCarbonImports` preprocessor
- remove `GlobalHeader` and `SideNav` subfolders
- move `truncate` action from `actions` to `src/Truncate`

**Features**

- add `breakpointObserver`, `breakpoints` to base exports
- add `ProgressBar` `kind` prop to support inline, indented variants

**Fixes**

- add explicit `type="button"` attribute to interactive, filterable tag variants
- add TypeScript support for `sveltekit:` attributes for anchor elements
- `Link` types should extend `a` or `p` attributes
- prevent selectable `DataTable` with sticky header from jumping

**Refactor**

- use icons from `carbon-icons-svelte` v11

**Documentation**

- add `DataTable` "Sticky header" example
- refactor `Grid` examples
- add note to `UIShell` that theming is not supported
- add `ProgressBar` examples "Inline variant" and "Indented variant"

**Housekeeping**

- upgrade `carbon-components` to v10.56.0

## [0.62.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.62.3) - 2022-03-26

**Fixes**

- fix `TreeView` filter logic in expandNodes/collapseNodes
- correctly render slotted label in `NumberInput`
- only render expandable `DataTable` row content when expanded

## [0.62.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.62.2) - 2022-03-23

**Fixes**

- `DataTable` expandable variant should work with zebra styles
- `DatePicker` `flatpickrProps` should override default `flatpickr` options

**Documentation**

- add `DataTable` "Expandable (zebra styles)" example

## [0.62.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.62.1) - 2022-03-20

**Fixes**

- fix `ToolbarSearch` standalone usage where "DataTable" context can be undefined

## [0.62.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.62.0) - 2022-03-19

**Breaking Changes**

- remove `Copy` component
- do not prevent default submit behavior in `Form`

**Features**

- add `shouldFilterRows` prop to `ToolbarSearch` to support auto-filterable `DataTable` rows
- make `SideNavLink` text slottable
- make `icon` prop slottable in `ContextMenuOption`, `Link`, `Tag`, `HeaderAction`, `HeaderActionLink`, `SideNavLink`, `SideNavMenu`
- make `MultiSelect` slottable
- make `Dropdown` slottable
- make `ComboBox` slottable

**Fixes**

- stop click propagation on `HeaderAction` button

**Refactor**

- inline `Copy` component in `CopyButton`, `CodeSnippet`
- use native `bind:value` in `Search`
- use native `bind:value` in `TextArea`

**Documentation**

- add `DataTable` "Filterable" and "Filterable (custom)" examples
- add `MultiSelect` "Custom slot" example
- add `Dropdown` "Custom slot" example
- add `ComboBox` "Custom slot" example
- add note that `items` object in `ComboBox`, `Dropdown`, `MultiSelect` requires a unique `id`
- add `ClickableTile` "Prevent default behavior" example
- add `Form` "Prevent default behavior" example
- fix broken link in `Checkbox` docs

## [0.61.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.61.1) - 2022-03-13

**Fixes**

- do not generate CSS file from `css/_popover.scss`

## [0.61.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.61.0) - 2022-03-13

**Breaking Changes**

- remove `HeaderActionSlideTransition` interface from `HeaderAction`; type transition prop as `SlideParams`
- rename `Breakpoint` "on:match" event to "on:change"
- move `Breakpoint` breakpoints to `carbon-components-svelte/src/Breakpoint/breakpoints`

**Features**

- support `DataTable` non-selectable rows
- expose `MultiSelect` highlightedId as a prop
- add `breakpointObserver` store as an alternative to `Breakpoint`

**Fixes**

- audit `HeaderAction` text styles
- visually align `HeaderActionLink` icon with `HeaderAction` icon
- fix `MultiSelect` filterable selection error
- correctly type `FileUploaderDropContainer` validateFiles prop
- inline `Popover` SCSS from `carbon-components@10.47`

**Refactor**

- remove usage of deprecated `Icon` component
- use direct component imports where possible

**Documentation**

- add `DataTable` "Non-selectable rows" example
- add `OverflowMenu` "Disabled items" example
- add `Breakpoint` "Store and Breakpoint Values" example

## [0.60.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.60.0) - 2022-02-26

**Features**

- add `RadioButtonGroup` `hiddenLegend` prop to visually hide the legend
- add `ProgressBar` `size` prop to support small size variant

**Fixes**

- update `DatePicker` calendar instance if options change

**Refactor**

- remove `StructuredList` `overflow-y` style monkey patch

**Documentation**

- add `RadioButton` "Hidden legend" example
- add `ProgressBar` "Small size" example

**Housekeeping**

- upgrade `carbon-components` to v10.54.0

## [0.59.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.59.0) - 2022-02-21

**Features**

- add `maxCount` prop to `TextArea`
- add `disabled` prop to `FileUploader`
- add `files` prop to `FileUploaderDropContainer`
- add `files` prop to `FileUploaderButton`

**Fixes**

- change `add`, `change` events in `FileUploaderDropContainer` to dispatch `File[]` instead of `FileList`
- update `files` prop description in `FileUploader`

**Documentation**

- add `TextArea` "Maximum character count" example
- add `FileUploader` disabled state example
- add `FileUploader` "Clear files" example
- document `validateFiles` prop for `FileUploaderDropContainer`
- add descriptions for `FileUploaderButton`, `FileUploader` examples

**Housekeeping**

- upgrade `carbon-components` to v10.53.0

## [0.58.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.4) - 2022-02-21

**Fixes**

- dispatched events without a `detail` type should be `null` instead of `any`
- `FileUploader` `clearFiles` description should reflect that it's an accessor, not a prop
- `FileUploader` should correctly fire `add` and `remove` events
- `FileUploader` files should not be keyed by file name
- `FileUploader` change event detail signature should be `File[]`
- fix `DataTable` regression where sort icon indicators don't update

**Refactor**

- remove unnecessary JSDoc default type notation

## [0.58.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.3) - 2022-02-20

**Fixes**

- correctly set deprecation comments for deprecated components
- `TextInput` and `PasswordInput` should render label if "labelText" slot is used
- `PasswordInput` should not render `label` if no `labelText` is provided
- `StructuredList` overflow-y should not be "hidden"
- `MultiSelect` should not prevent default key behavior when open
- `Switch` should have `type="button"`

## [0.58.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.2) - 2022-02-12

**Fixes**

- `Tooltip` `aria-label` should use `iconDescription` if `triggerText` is falsy
- `OverflowMenu` keyboard navigation should skip disabled items
- UI Shell `HeaderPanelDivider` should use `hr` element to represent divider
- `Button` should not set `aria-pressed` on icon-only, link buttons

## [0.58.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.1) - 2022-02-11

**Fixes**

- remove whitespace from `pre` tag in `CodeSnippet` (Svelte v3.46.4 preserves `pre` whitespace by default)

## [0.58.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.58.0) - 2022-02-11

**Breaking Changes**

- if `TextInput` is `type="number"`, value can be a `number` or `null` to signify "no value"
- `TextInput` dispatches instead of forwards `input`, `change` events (detail: `null | number | string`)

**Features**

- pass `rowIndex`, `cellIndex` to `DataTable` "cell" slot
- add `itemToInput` prop to `MultiSelect` to customize name, title, labelText values
- add `open` prop to `TooltipDefinition`; dispatch `open`, `close` events

**Fixes**

- `DataTable` headers should be reactive
- `DataTable` batch selection checkbox should be reactive
- `MultiSelect` should correctly lose focus
- non-filterable `MultiSelect` should dispatch a `blur` event
- resolve `MultiSelect` accessibility issues
- toggle `HeaderNavMenu` when pressing "Enter" or "Space"
- close `HeaderNavMenu` menu when pressing "Enter" on an item
- resolve `HeaderNavMenu` accessibility issues
- fix `TextInput` reactivity by using native `bind:value`

**Documentation**

- remove duplicate "Heading variant" example

**Housekeeping**

- upgrade `carbon-components` to v10.52.0

## [0.57.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.57.1) - 2022-02-01

**Fixes**

- `Tooltip` definition is missing open, close events
- `TooltipDefinition` button should have `type="button"`

## [0.57.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.57.0) - 2022-01-30

**Breaking Changes**

- make `NumberInput` "input" event type consistent with "change" (`null | number`)

**Features**

- dispatch `NumberInput` input, change events when clicking the steppers
- add `primaryButtonIcon` prop to `Modal`, `ModalFooter`

**Fixes**

- prevent `NumberInput` from coercing empty string to `0`

## [0.56.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.56.1) - 2022-01-27

**Fixes**

- `NumberInput` with value `0` should not be converted to `null`

## [0.56.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.56.0) - 2022-01-27

**Breaking Changes**

- type `NumberInput` value as `null | number` instead of `string | number` (`null` signifies "no value")

**Fixes**

- export `readonly` as a prop in `TextArea`
- fix `Checkbox` two-way binding for `checked`, `group` props

**Documentation**

- add `Checkbox` reactive example for `bind:checked`
- update `Checkbox` reactive example for `bind:group` to demo two-way binding
- simplify `Tabs` reactive example
- add `NumberInput` "No value" example

## [0.55.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.55.0) - 2022-01-22

**Features**

- forward `focus`, `blur` events to `NumberInput`
- update `ProgressStep` icons for current, incomplete steps
- type `id` as `any` instead of `string` in `ComboBox`, `Dropdown`, `MultiSelect`

**Fixes**

- do not coerce empty value to `0` in `NumberInput` if `allowEmpty` is true
- label `Slider` input if `aria-label` not explicitly defined
- add missing `required` prop to `RadioButton`
- add missing `required` prop to `Checkbox`
- include `@default undefined` annotations for props that are `undefined` by default

**Refactor**

- remove hotfix in `DatePicker` to prevent disabled icon from being clickable

**Housekeeping**

- upgrade `carbon-components` to v10.51.0

## [0.54.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.54.0) - 2022-01-19

**Features**

- support paginated `DataTable`

## [0.53.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.53.0) - 2022-01-18

**Breaking Changes**

- replace `selectedIndex` with `selectedId` in `Dropdown`
- replace `selectedIndex` with `selectedId` in `ComboBox`

**Fixes**

- prevent `Dropdown` icon from being clickable when disabled

## [0.52.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.52.0) - 2022-01-17

**Features**

- make `Toggle` labels slottable
- add option to `ComboBox.clear` to not re-focus input (`clear({ focus: false })`)

**Fixes**

- break out of trap focus in `Tooltip` when pressing "Escape"
- pass "name" prop in `ComboBox` to input element
- emit `change` event in `Checkbox` after modifying state
- restore explicit typing of `null | HTMLElement` for TypeScript strict mode
- dispatch `click:button--primary` in `Modal` if `shouldSubmitOnEnter` is true

**Documentation**

- simplify reactive `RadioButton` example
- add reactive `Select` example for `Select`
- fix grammar in `TreeView` "Expand all nodes" example
- note that `Search` clear event is also dispatched when pressing "Escape"
- demo reactivity in expandable `Search` example

## [0.51.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.51.3) - 2022-01-12

**Fixes**

- fix `selectedIndex` reactivity in `ComboBox`

**Refactor**

- remove redundant `null` in `null | HTMLElement` prop types

## [0.51.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.51.2) - 2022-01-10

**Fixes**

- correctly reset values in `ComboBox` when manually clearing selection
- fix filterable `ComboBox` keyboard selection
- remove redundant role attributes from `Dropdown`, `Header` to fix a11y warnings
- fix `TileGroup` two-way binding on the `selected` prop

**Documentation**

- document `DatePicker` usage with a Rollup set-up
- add multiple modals example for `Modal`
- add reactive examples for `RadioTile`

## [0.51.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.51.1) - 2022-01-03

**Fixes**

- add missing `required` prop to `Select`
- set global theme variable first in SCSS files

## [0.51.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.51.0) - 2021-12-30

**Features**

- enhance `Checkbox` to support `bind:group`

## [0.50.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.5) - 2021-12-30

**Fixes**

- filterable `MultiSelect` should blur when pressing "Tab"
- filterable `MultiSelect` menu should close when pressing "Escape"
- filterable `MultiSelect` menu should open when pressing "Space"
- `DatePicker` input should not lose focus when pressing "Enter"
- `ToolbarSearch` should expand if `value` is programmatically set

## [0.50.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.4) - 2021-12-30

**Fixes**

- pressing "Escape" in a `DatePicker` should not propagate past the open calendar
- prevent menu icon in filterable `MultiSelect` from triggering twice

## [0.50.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.3) - 2021-12-28

**Fixes**

- do not dispatch "click", "click:row" `DataTable` events when selecting a checkbox or radio button
- render "labelText" slot if `labelText` prop or `$$slots.labelText` is truthy
- prevent default behavior in `Tabs` mobile variant when clicking a menu option
- coalesce nullish values to `""` for `TextInput`, `PasswordInput`, `TextArea`

## [0.50.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.2) - 2021-11-27

**Fixes**

- select correct item in filterable `MultiSelect` using keyboard navigation
- do not mutate `sortedItems` in `MultiSelect`

## [0.50.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.1) - 2021-11-19

**Fixes**

- do not dispatch `DataTable` "click", "click:row" events if target is an `OverflowMenu`

## [0.50.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.50.0) - 2021-11-18

**Features**

- add `target` prop to `ContextMenu` to support custom trigger element(s)
- pass clicked element as `event.detail` in `ContextMenu` "open" event

## [0.49.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.49.2) - 2021-11-18

**Fixes**

- `Tabs` should not dispatch an initial "change" event when no change has occurred
- `Pagination` page value should not exceed total pages
- fix `Popover` relative prop by inlining style
- replace `onDestroy` with `onMount` return function to avoid running code server-side

## [0.49.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.49.1) - 2021-11-17

**Fixes**

- include missing `Popover` styles from `carbon-components@10.47`

## [0.49.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.49.0) - 2021-11-12

**Features**

- support `UIShell` HeaderNavMenu with current item
- make `InlineNotification` title, subtitle props slottable
- make `ToastNotification` title, subtitle, and caption props slottable

**Refactor**

- remove unnecessary "position: relative" style in `ExpandableTile`
- remove unused `refContent` in `ExpandableTile`

**Housekeeping**

- upgrade `carbon-components` to v10.48.0

## [0.48.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.48.1) - 2021-11-12

**Fixes**

- type `DatePicker` locale prop as flatpickr `CustomLocale` or `key`
- update remaining `carbon-icons-svelte` imports to use inlined icons

## [0.48.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.48.0) - 2021-11-11

**Breaking Changes**

- remove `carbon-icons-svelte` from direct dependencies

**Features**

- support auto-width `Tabs`
- add ref prop to `Form`

**Fixes**

- set calendar instance to `null` when destroying `DatePicker`

## [0.47.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.6) - 2021-11-10

**Fixes**

- fix `Tooltip` two way binding when icon is in focus
- coerce `TextInput` value to a number if `type="number"`

## [0.47.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.5) - 2021-11-07

**Fixes**

- fix `Tooltip` open/close logic to allow two way binding of the `open` prop
- inline `position: relative` style in `ExpandableTile`

## [0.47.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.4) - 2021-11-06

**Fixes**

- only dispatch `click:row--expand` when clicking an expandable `DataTable` row chevron

## [0.47.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.3) - 2021-10-22

**Fixes**

- correctly toggle batch expansion button in `DataTable`

## [0.47.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.2) - 2021-10-21

**Fixes**

- close the open `Tooltip` when using multiple tooltips
- collapse batch expansion button in `DataTable` if one or more rows is collapsed
- omit explicit reference to "carbon-icons-svelte" from `icon` prop descriptions

## [0.47.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.1) - 2021-10-20

**Fixes**

- include border style for non-expandable rows in a batch expandable `DataTable`

## [0.47.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.47.0) - 2021-10-19

**Features**

- add `nonExpandableRowIds` prop to `DataTable` to specify rows that should not be expandable

## [0.46.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.46.0) - 2021-10-17

**Breaking Changes**

- use `.svelte.d.ts` extension instead of `.d.ts` for Svelte component TypeScript definitions

**Features**

- support `Tag` outline type
- add `hideLabel` prop to `MultiSelect`
- allow any Svelte component to be used for `icon` props, not just `CarbonIcon`
- add `closeIcon` prop to `HeaderAction` to override the default `Close20` icon

**Fixes**

- avoid opening the calendar if `DatePickerInput` is a disabled `fieldset` descendant
- remove `stopPropagation` modifier from `HeaderAction` to allow multiple UI Shell app switchers

**Housekeeping**

- upgrade `carbon-components` to v10.46.0

## [0.45.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.45.1) - 2021-10-15

**Fixes**

- prevent space/enter keys from selecting incomplete `ProgressIndicator` steps

## [0.45.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.45.0) - 2021-10-13

**Features**

- add `TreeView` component accessors to programmatically expand/collapse nodes

## [0.44.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.7) - 2021-10-13

**Fixes**

- add missing `value` prop to `Checkbox`

## [0.44.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.6) - 2021-10-11

**Fixes**

- fix `DataTable` sorting to tolerate `null`, `undefined` values

## [0.44.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.5) - 2021-10-04

**Fixes**

- correctly apply `menuOptionsClass` in `OverflowMenu`

## [0.44.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.4) - 2021-09-28

**Fixes**

- `ClickableTile` TypeScript definition restProps should extend attributes of either `a` or `p` tags

## [0.44.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.3) - 2021-09-23

**Fixes**

- correctly apply styles when using a static width `DataTable` with a title and description

## [0.44.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.2) - 2021-09-14

**Fixes**

- prevent redundant `clear` events in `ComboBox`

## [0.44.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.1) - 2021-09-11

**Fixes**

- if `ComboBox` is disabled, clicking the chevron icon should not toggle the dropdown
- `ToolbarBatchActions` cancel button text should be slottable

## [0.44.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.44.0) - 2021-09-07

**Features**

- add ability to override or customize `DatePicker` calendar options using the `flatpickrProps` prop

## [0.43.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.43.0) - 2021-09-06

**Features**

- add ability to programmatically clear a `ComboBox` using the `clear` component accessor

## [0.42.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.42.3) - 2021-09-05

**Fixes**

- `RadioButton` "labelText" slot should render even if `labelText` is falsy
- only render `FormGroup` `legend` element if `legendText` is truthy

## [0.42.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.42.2) - 2021-07-29

**Fixes**

- fix reactivity regression in `ComboBox`

**Documentation**

- update example set-ups
- document styling instructions, `carbon-preprocess-svelte` in README.md

## [0.42.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.42.1) - 2021-07-26

**Fixes**

- disable `a11y-mouse-events-have-key-events` warnings
- upgrade `carbon-icons-svelte` to v10.36.0 to quell `a11y-mouse...` warnings

**Refactor**

- remove `formatStyle` utility in `OverflowMenu`

**Documentation**

- add `svelte:head` example usage for loading CDN styles
- add instructions for dynamic theming
- update number of available Carbon icons

## [0.42.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.42.0) - 2021-07-22

**Features**

- add `helperText` prop to `DatePickerInput`

**Fixes**

- replace `svelte:body` with `svelte:window` when listening for an outside click

**Documentation**

- fix typos in styling instructions
- update expanded nodes guidance
- add `DatePicker` example "With helper text"

**Refactor**

- omit explicit `treeview.scss` import in `css/*.scss` files as it is included by default in `carbon-components@10.40`

**Housekeeping**

- upgrade `carbon-components` to v10.40.0

## [0.41.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.41.0) - 2021-07-18

**Features**

- add expandedIds to `TreeView`

**Fixes**

- do not fall back to an empty string for a `DataTable` value if falsy
- omit disabled attribute in `Button` if value is falsy

**Documentation**

- add styling instructions to the home page

## [0.40.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.40.1) - 2021-07-14

**Fixes**

- focus first, non-disabled `TreeView` node if active id does not match the selected id
- set `type="button"` on `OverflowMenu` to prevent submit behavior when pressing "Enter"
- update semantic attributes in `OverflowMenuItem`
- do not render `OverflowMenuItem` title attribute if using a slot
- do not dispatch `NumberInput` on:change event on initialization
- dynamically load ESM `flatpickr` rangePlugin
- forward input, focus events to `Select`
- type `DataTableRowId` as `any`, fixes

## [0.40.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.40.0) - 2021-07-11

**Breaking Changes**

- remove `appendTo` prop in `DatePicker` for server-side rendering (SSR) compatibility

**Features**

- add `Breakpoint` component to detect the current Carbon grid size based on browser width
- add `Theme` component to dynamically update the current theme client-side
- add `valueFrom`, `valueTo` props for range `DatePicker`
- export `multiSelectRef`, `fieldRef`, `selectionRef` in `MultiSelect`
- add clearItem, clearAll instance methods to `LocalStorage`
- support `NumberInput` readonly variant

**Fixes**

- append `DatePicker` instance to local reference to prevent arrow key locking
- fix `on:change` type signature in `DatePicker`
- export id prop in `ProgressBar`
- add skeleton text for every row and column in `DataTableSkeleton`
- deprecate `shouldShowBorder` prop in `Table`
- correctly type exported constant props and function declarations as accessors in `SvelteComponentTyped` interface

**Documentation**

- document Breakpoint component
- document Theme component
- add ProgressBar "UX example"
- add DatePicker example "Range"
- add NumberInput example "Read-only variant"

**Housekeeping**

- upgrade `carbon-components` to v10.39.0

## [0.39.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.39.0) - 2021-07-05

**Breaking Changes**

- remove `clipboard-copy` direct dependency; use native Clipboard API instead of `clipboard-copy` to copy text in `CopyButton`, `CodeSnippet`

**Features**

- add `TreeView` component
- add `RecursiveList` component
- support 3 buttons in `Modal`, `ComposedModal` via `secondaryButtons`
- make `DataTable` title/description slottable
- allow custom `expansionBreakpoint` in UI Shell `Header`, `SideNav`
- dispatch "click:button--primary" as an alias to "submit" in `Modal`, `ComposedModal`

**Fixes**

- export `useStaticWidth` prop in `DataTable`
- do not render `DataTable` table header if title/description not provided

**Documentation**

- add TreeView documentation
- add RecursiveList documentation
- add CopyButton examples "Overriding copy functionality", "Preventing copy functionality"
- add CodeSnippet examples "Overriding copy functionality", "Preventing copy functionality"
- add DataTable example "Static width"
- include typedefs in Component API section

## [0.38.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.38.2) - 2021-07-03

**Fixes**

- prevent `<TextArea readonly={false} />` from being read-only
- only focus `OveflowMenuItem` if not disabled
- trap tab focus within `Modal`, `ComposedModal`

## [0.38.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.38.1) - 2021-06-29

**Fixes**

- add Gray 80 (g80) theme to `all.scss` and the pre-compiled `all.css`

## [0.38.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.38.0) - 2021-06-27

**Features**

- support read-only `TextInput`
- render a checkmark icon for the selected `ComboBox` item

**Fixes**

- adjust `FileUploaderDropContainer` markup to avoid accessibility error for nested interactive controls
- use `ErrorFilled16` icon in `InlineLoading` for the error status
- render iconDescription as title in error/warning icons in `InlineLoading`
- update accessibility attributes for `StructuredList`
- use `span` instead of `div` in `TooltipDefinition` to avoid potential invalid HTML
- close `MultiSelect` menu when blurring the last filterable option
- open/focus field when tab focusing a filterable `MultiSelect`
- unblock tab navigation when blurring `MultiSelect`
- select correct item using keyboard navigation in a filterable `ComboBox`
- unblock input after clearing a `ComboBox` selection
- update `ComboBox` input text if item is selected
- toggle `SideNav` rail when clicking the hamburger menu
- update `ContextMenu` class names
- close `ContextMenu` when left clicking anywhere

**Documentation**

- add TextInput example "Read-only variant"
- add Popover example "Popover alignment"

**Housekeeping**

- upgrade `carbon-components` to v10.38.0

## [0.37.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.37.0) - 2021-06-26

**Features**

- add ProgressBar component

**Fixes**

- omit size prop in `ToolbarSearch`
- omit passing iconDescription to `NotificationIcon` in `InlineNotification`, `ToastNotification`

**Refactor**

- use class directive in `TextInput`

**Documentation**

- add ProgressBar component documentation

**Housekeeping**

- upgrade `carbon-components` to version 10.37.0

## [0.36.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.36.0) - 2021-06-26

**Features**

- add condensed, flush props to `StructuredList`
- support `SideNav` rail
- add isSelected prop to `HeaderNavItem`
- make components with `labelText` prop slottable (e.g., <span slot="labelText">...</span>)

**Fixes**

- set min/max height for multi-line `CodeSnippet`
- make `ImageLoader` SSR compatible by using a window type check guard
- default isSelected to false in `SideNavMenuItem`
- forward keydown event to `TextArea`
- deprecate border prop in `StructuredList`

**Documentation**

- add separate disabled example for filterable/interactive tags
- update number of supported chart types from 17 to 20

**Housekeeping**

- upgrade `carbon-components` to version 10.36.0

## [0.35.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.35.0) - 2021-06-26

**Features**

- support expressive styles for `Button`, `UnorderedList`, `OrderedList`
- support large size for `Button` (`size="lg"`)
- support large, extra-large `ButtonSkeleton` sizes
- support field, small sizes for `FileUploaderItem`
- allow custom `Search` icon
- allow `NumberInput` input steppers to be hidden (`hideSteppers={true}`)
- add `icon` prop to `TooltipIcon`
- support disabled `TooltipIcon`

**Fixes**

- make `Tooltip` screenreader description less verbose

**Documentation**

- add Button examples "Large size", "Expressive styles"
- add OrderedList example "Expressive styles"
- add UnorderedList example "Expressive styles"
- add Search example "Custom search icon"
- add NumberInput example "Hidden steppers"
- add TooltipIcon example "Disabled"

**Housekeeping**

- upgrade `carbon-components` to version 10.35.0

## [0.34.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.34.0) - 2021-06-25

**Features**

- add new Gray 80 (g80) theme
- support expandable `Search` variant
- dispatch open, close, click:overlay events in `SideNav`
- allow custom hamburger menu icons (`iconMenu`, `iconClose`)
- support "xl" `Button` size
- support "medium" `DataTable` size
- support warning state, inline variant for `PasswordInput`

**Fixes**

- replace `<strong>` with semantic paragraph element for file uploader label
- wrap `code` element with `pre`
- add missing restProps annotation to `ToolbarSearch`

**Refactor**

- remove usage of deprecated `Icon` component
- use button specific tooltip class for icon-only variant

**Documentation**

- update available site theming options to include Gray 80 (g80)
- add Search example "Expandable variant"
- add Button example "Extra-large size"
- add DataTable example "Medium rows"
- add PasswordInput examples "Inline" and "Warning state"

**Housekeeping**

- upgrade `carbon-components` to version 10.34.0

## [0.33.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.33.0) - 2021-04-30

**Features**

- support nested object values for DataTable sorting
- pass DataTable header display function to slotted cell
- add icon prop to `Link` to support rendering links with icons; refactor `OutboundLink` to use `Link.icon` prop

**Fixes**

- prevent DataTable sorting from crashing by defaulting `undefined` to an empty string
- add extra DataTable cell `colspan` to support expandable, selectable rows
- support disabled state for `ClickableTile`
- add missing "3x2" ratio to `AspectRatio`

**Documentation**

- add DataTable example ["Sortable with nested object values"](https://svelte.carbondesignsystem.com/components/DataTable#sortable-with-nested-object-values)
- add ClickableTile example ["Disabled state"](https://svelte.carbondesignsystem.com/components/ClickableTile#disabled-state)
- add Link example ["Link with icon"](https://svelte.carbondesignsystem.com/components/Link#link-with-icon)

**Housekeeping**

- upgrade `carbon-components` to version 10.33.0

## [0.32.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.32.2) - 2021-04-23

**Fixes**

- prevent multiple Dropdown items from being selected by updating the `selectedId`
- prevent the default keydown behavior so that pressing "Enter" should open the Dropdown menu
- resolve Carbon icon imports to Svelte files in `DataTable`, `HamburgerMenu` components

**Housekeeping**

- patch `carbon-components` to version 10.32.1

## [0.32.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.32.1) - 2021-04-02

**Fixes**

- hotfix compiled CSS to correctly render default background color for inputs

## [0.32.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.32.0) - 2021-04-02

**Breaking Changes**

- copy text by default in `CodeSnippet` and `CopyButton` using `clipboard-copy`
- deprecate `light` prop in `ContentSwitcher`

**Features**

- support disabled state for `SelectableTile`, `RadioTile`
- add `TooltipFooter` component
- support `OverflowMenu` in Breadcrumbs
- support danger kind for `ContextMenuOption`
- allow sorting to be disabled for a specific header in `DataTable`
- render an empty header column in `DataTableSkeleton` if a value is `{ "empty": true }`
- export `inputRef` prop in `MultiSelect`
- add `searchClass` prop to `Search`, which is passed to the outermost element
- add `noMargin` prop to `FormGroup` to remove default bottom margin (default value is `false`)

**Fixes**

- render initial `ContextMenu` position based on viewport constraints
- correctly display invalid text in `TimePicker`
- remove outer div in `ToolbarSearch`
- set hasScrollingContent class on `ModalBody`

**Documentation**

- add disabled state examples for `SelectableTile`, `RadioTile`
- add expandable `DataTable` size examples, empty header column `DataTableSkeleton` example
- remove the light `ContentSwitcher` example

**Housekeeping**

- upgrade `carbon-components` to version 10.32.0
- add `clipboard-copy` to direct dependencies

## [0.31.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.31.1) - 2021-03-28

**Fixes**

- add missing "name" attribute to non-mobile `NumberInput`
- forward missing "keydown" event to `Form`
- forward click/keydown/mouse events in `FluidForm` to `Form`

## [0.31.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.31.0) - 2021-03-20

**Breaking Changes**

- remove default `title` value in `InlineNotification`
- remove default `title`, `caption` values in `ToastNotification`
- remove `iconDescription` prop from `HeaderNavMenu`

**Features**

- add `Popover` component
- add `ContextMenu` component
- add "container" type for `TabsSkeleton`
- add warning state to `Select`
- dispatch "on:click:button--next" and "on:click:button--previous" in `Pagination`

**Fixes**

- replace chevron icons with "Add" and "Subtract" icons in `NumberInput`
- fix `Slider` markup to use CSS to hide input if `hideTextInput` is `true`
- remove hotfix inline style to center dropdown chevron
- add "rowgroup" role to `StructuredListBody`
- fix type definition for `MultiSelect`: "clear" should be typed as a custom event
- remove line breaks in anchor element in `Link`
- only set `autofocus` attribute if the value is `true`

**Documentation**

- add `Slider` hidden text input, invalid, disabled examples
- add `Select` warning, invalid, helper text, skeleton (hidden label) examples
- add `RadioButton` disabled buttons example
- update sample copy in `ToastNotification`, `InlineNotification`
- update `Select` item groups example to use the hidden default option

**Housekeeping**

- upgrade `carbon-components` to version 10.31.0
- upgrade `carbon-icons-svelte` to version 10.27.0 (icons are correctly typed using `SvelteComponentTyped`)

## [0.30.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.30.0) - 2021-03-13

**Breaking Changes**

- forward `$$restProps` to the input element in `Search`, `MultiSelect`, `ComboBox`, `TimePicker`, `DatePickerInput`, `NumberInput`

**Features**

- add `ImageLoader` component
- add `LocalStorage` component
- forward "clear" event in `ToolbarSearch`
- add isSelected prop for icon-only, ghost buttons
- add legendText prop/slot to `RadioButtonGroup`
- add interactive prop to `Tag`
- make UI Shell `SideNavMenuItem` text slottable
- deprecate `Icon`, `IconSkeleton`

**Fixes**

- set aria-hidden attribute in UI Shell `SideNav`
- only show overlay for non-fixed UI Shell `SideNav`
- correctly render skeleton styles for `TextInputSkeleton`
- only render `RadioButton` label if `labelText` is truthy
- deprecate the `NumberInput` mobile variant
- add missing type annotation for dispatched `MultiSelect` select event
- remove redundant "button" role in `Button`
- update styles for `ListBoxSelection` to fix filterable `MultiSelect`
- temporarily apply override styles to `ListBoxMenuIcon` to correctly render `Dropdown` chevron icon
- apply `z-index: 1` on tooltip when open; style can be overridden through `$$restProps.style`

**Documentation**

- add "on:clear" example for `Search`
- add custom tooltip example for `PasswordInput`
- add legend text examples for `RadioButtonGroup`
- add filterable (disabled) variant for `Tag`
- remove the mobile variant example for `NumberInput`

**Housekeeping**

- upgrade `carbon-components` to v10.30.0

## [0.29.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.29.2) - 2021-03-01

**Fixes**

- remove blank line after `slot` to correctly render button with icon in Safari 13

## [0.29.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.29.1) - 2021-02-26

**Fixes**

- fix blur logic in `ComboBox`, `MultiSelect` based on relatedTarget tag name
- fix `truncate` action to preserve existing class names on node
- use new component tokens to correctly render CSS for tags, low contrast notifications

## [0.29.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.29.0) - 2021-02-19

**Breaking Changes**

- The default placeholder text for `TimePicker` is changed from "hh=mm" to "hh:mm"

**Features**

- Add UI Shell `SideNavDivider` component
- Add a direction prop to `ComboBox`, `Dropdown`, `MultiSelect` to render the dropdown menu above or below the input
- Support `ComboBox` warning state
- Add text truncation component (`Truncate`) and action (`use:truncate`)
- Use shorthand scss imports in `css/*.scss` files
- Use the official `SvelteComponentTyped` interface in the component TypeScript definitions

**Fixes**

- Use `description` as warning icon title in `ProgressStep`
- Include pre-compiled CSS to library side effects to prevent inadvertent tree-shaking
- Fix `DataTable` type definition to include `$$restProps`

**Documentation**

- Add filterable small `Tag` example
- Add `ComboBox` invalid state example
- Add "Top direction" examples for `ComboBox`, `Dropdown`, `MultiSelect`
- Demo `ProgressIndicator` invalid/disabled steps
- Fix `RadioTile` light variant example

**Housekeeping**

- Upgrade `carbon-components` to version 10.29.0

## [0.28.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.28.0) - 2021-02-05

**Breaking Changes**

- The `transitionend` event in ComposedModal is dispatched, not forwarded; it will only trigger when the modal has finished animating

**Features**

- Support small size variant for Tag (`size="sm"`)
- Dispatch `close` event in a filterable Tag (an alias for `click`)
- Dispatch `toggle` event in Toggle
- Make `tooltipText` slottable in TooltipIcon (slot name="tooltipText")
- Add `hideLabel` prop to Dropdown
- Dispatch `transitionend` event in Modal, ComposedModal to fire after the modal has finished animating
- Add warn state to DatePickerInput

**Fixes**

- Forward the `click` event to Tab
- Do not trigger initial Tab focus when mounting

**Documentation**

- Add a "Hidden label" example for the Select component
- Add a light variant example for OverflowMenu
- Add a reactive example for Tabs

**Housekeeping**

- Upgrade `carbon-components` to version 10.28.0
- Remove unused `@carbon/themes` development dependency; themes are pulled from `carbon-components`

## [0.27.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.27.0) - 2021-01-28

**Features**

- Ship scss files used to pre-compile CSS
- Add `optimizeCarbonImports` preprocessor to rewrite base imports from Carbon components/icons/pictograms to the source Svelte file
- Support warning state in Dropdown, MultiSelect, NumberInput
- Set default values for Button `tooltipAlignment` ("center") and `tooltipPosition` ("bottom") in Button
- Infer icon-only Button variant using $$slots API
- Support disabled state for CodeSnippet (single or multi type only)
- Add optional expand/collapse icon labels to ExpandableTile
- Support custom icon variant for Tag
- Add `timeout` to dispatched `on:close` event detail in InlineNotification and ToastNotification
- Upgrade `flatpickr` to version 4.6.9 for ES module (ESM) imports

**Fixes**

- Co-locate DataTableSkeleton with DataTable components
- Prevent MultiSelect dropdown from opening if disabled
- Forward `submit` event to FluidForm
- Correctly apply class props in ModalHeader
- Add missing warning class to TextInput
- Disable visibility toggle if PasswordInput is disabled
- "Show more" button in CodeSnippet should be "field" sized, not small
- Remove extraneous "bx--btn--copy" class from CodeSnippet
- Adjust Loading spinner styles to remove excess padding
- Prevent class from being overridden by $$restProps in InlineNotification, ToastNotification, NotificationActionButton
- Remove extraneous focus ring in Modal
- Remove aria-hidden prop from ToolbarSearch
- Add label id to Slider
- Remove menubar role from HeaderNav; deprecate ariaLabel prop in HeaderNav in favor of real HTML attributes "aria-label" and "aria-labelledby"
- Remove notificationType prop from InlineNotification and ToastNotification
- Focus the first item when opening an OverflowMenu for the first time
- Close the OverflowMenu on the `focusout` event
- Forward $$restProps to the input element for TextInput, PasswordInput

**Breaking Changes**

- DataTableSkeleton.svelte is moved to `src/DataTable`
- `notificationType` is removed from InlineNotification and ToastNotification
- Svelte version 3.25 or greater is required due to use of the $$slots API
- $$restProps are forwarded to the input element for TextInput, PasswordInput
- `renderIcon` prop renamed to `icon` in NotificationButton
- `icon` prop type changed to "typeof import("carbon-icons-svelte").CarbonIcon" in HeaderAction, HeaderActionLink, SideNavLink, SideNavMenu
- Pre-compiled CSS StyleSheets use the "compressed" `sass.outputStyle` instead of "compact"

**Documentation**

- Add documentation for dynamic, client-side theming
- Add icon-only example for the "danger-tertiary" Button
- Update number of supported Carbon icons and pictograms
- Use more realistic body copy in Notification usage examples
- Update development workflow in the contributing guidelines

**Housekeeping**

- Replace `node-sass` with `sass`
- Upgrade `carbon-components` to version 10.27.0
- Upgrade `@carbon/themes` to version 10.26.0
- Upgrade `autoprefixer`, `postcss`, `prettier-plugin-svelte`

## [0.26.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.26.0) - 2020-12-11

**Features**

- Render the UI Shell hamburger menu only if the `SideNav` component is present ([PR #457](https://github.com/carbon-design-system/carbon-components-svelte/pull/457), [issue #434](https://github.com/carbon-design-system/carbon-components-svelte/issues/434))
- Clear the `Search` input value if the "Escape" key is pressed ([PR #448](https://github.com/carbon-design-system/carbon-components-svelte/pull/448))
- Customize the `Tooltip` alignment using the `align` prop ([PR #446](https://github.com/carbon-design-system/carbon-components-svelte/pull/446), [issue #398](https://github.com/carbon-design-system/carbon-components-svelte/issues/398))

**Fixes**

- Fix `files` prop type `FileUploader` to be a list of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File) instead of file names ([PR #437](https://github.com/carbon-design-system/carbon-components-svelte/pull/437))
- Allow binding decimal values in `NumberInput` ([PR #444](https://github.com/carbon-design-system/carbon-components-svelte/pull/444))
- Spread `$$restProps` in `DataTableSkeleton` to the top-level element to be consistent with `DataTable` ([PR #441](https://github.com/carbon-design-system/carbon-components-svelte/pull/441), [issue #423](https://github.com/carbon-design-system/carbon-components-svelte/issues/423))
- Close the `Tooltip` on the mousedown event; re-focus the tooltip icon after closing and forward `click`, `mousedown` events
- Focus the `Dropdown` button correctly for multiple dropdowns ([PR #447](https://github.com/carbon-design-system/carbon-components-svelte/pull/447))
- Focus the `ComboBox` input correctly for multiple combo boxes ([PR #447](https://github.com/carbon-design-system/carbon-components-svelte/pull/447))
- Blur an opened `ComboBox` when clicking a search input ([PR #447](https://github.com/carbon-design-system/carbon-components-svelte/pull/447), [issue #436](https://github.com/carbon-design-system/carbon-components-svelte/issues/436))
- Prevent cursor shift in UI Shell `HeaderSearch` when using the up/down arrow keys to navigate results ([PR #432](https://github.com/carbon-design-system/carbon-components-svelte/pull/432), [issue #431](https://github.com/carbon-design-system/carbon-components-svelte/issues/431))
- Deprecate `small` prop in `ButtonSkeleton`
- Fix `CodeSnippetSkeleton` type to only be "single" or "multi"

**Breaking Changes**

- `files` in `FileUploader` components is a list of [Files](https://developer.mozilla.org/en-US/docs/Web/API/File), not just file names
- `$$restProps` is spread to the top-level element in `DataTableSkeleton`

**Documentation**

- Add reactive, hidden, custom alignment examples for Tooltip
- Add reactive examples for `Search`, `ContentSwitcher`, `Toggle` components
- Add plain Header (no `SideNav`) UI Shell example

**Housekeeping**

- Upgrade `carbon-components` to version 10.25 for the pre-compiled CSS StyleSheets

## [0.25.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.25.1) - 2020-11-28

**Fixes**

- set `selectedResultIndex` in HeaderSearch when clicking a result ([PR #430](https://github.com/carbon-design-system/carbon-components-svelte/pull/430), [issue #429](https://github.com/carbon-design-system/carbon-components-svelte/issues/429))

## [0.25.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.25.0) - 2020-11-27

**Features**

- Add `padding` prop to Grid, Row, Column components ([PR #420](https://github.com/carbon-design-system/carbon-components-svelte/pull/420), [issue #410](https://github.com/carbon-design-system/carbon-components-svelte/issues/410))
- Add `transition` prop to UI Shell `HeaderAction` to customize panel slide transition; by default, the slide duration is `200`ms ([PR #419](https://github.com/carbon-design-system/carbon-components-svelte/pull/419), [issue #384](https://github.com/carbon-design-system/carbon-components-svelte/issues/384))

**Fixes**

- fix `Files` type for FileUploader ([PR #422](https://github.com/carbon-design-system/carbon-components-svelte/pull/422), [issue #421](https://github.com/carbon-design-system/carbon-components-svelte/issues/421))
- remove the fly transition from HamburgerMenu ([PR #419](https://github.com/carbon-design-system/carbon-components-svelte/pull/419), [issue #384](https://github.com/carbon-design-system/carbon-components-svelte/issues/384))

**Documentation**

- add ["Padded columns"](https://svelte.carbondesignsystem.com/components/Grid#padded-columns) example to Grid docs
- demo different transitions in ["Header with app switcher"](https://svelte.carbondesignsystem.com/components/UIShell#header-with-app-switcher) example in UI Shell
- describe use case for [using native styles in OrderedList](https://svelte.carbondesignsystem.com/components/OrderedList#native-list-styles)

**Housekeeping**

- pin development dependency `sveld` to version 0.3.0

---

**Contributors**

- [@ispyinternet](https://github.com/ispyinternet)
- [@miedzikd](https://github.com/miedzikd)

## [0.24.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.24.0) - 2020-11-26

**Features**

- Add HeaderSearch component for the UI Shell that can render user-provided search results ([PR #417](https://github.com/carbon-design-system/carbon-components-svelte/pull/417), [issue #395](https://github.com/carbon-design-system/carbon-components-svelte/issues/395)); HeaderActionSearch is deprecated in favor of HeaderSearch
- Expand `headers` prop type in DataTableSkeleton to be consistent with that of the DataTable ([PR #415](https://github.com/carbon-design-system/carbon-components-svelte/pull/415), [issue #413](https://github.com/carbon-design-system/carbon-components-svelte/issues/413))

**Fixes**

- Update `DataTableRow` prop type in DataTable to require an "id" key and value ([PR #415](https://github.com/carbon-design-system/carbon-components-svelte/pull/415), [issue #414](https://github.com/carbon-design-system/carbon-components-svelte/issues/414))

**Documentation**

- Add example ["Skeleton with object headers"](https://svelte.carbondesignsystem.com/components/DataTable#skeleton-with-object-headers) to the DataTable docs
- Add example ["Header with global search"](https://svelte.carbondesignsystem.com/components/UIShell#header-with-global-search) to the UI Shell docs
- deprecate HeaderActionSearch in favor of HeaderSearch

## [0.23.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.23.2) - 2020-11-25

**Fixes**

- Fix dispatched "change" event in RadioButtonGroup ([PR #408](https://github.com/carbon-design-system/carbon-components-svelte/pull/408))
- Export component types and interfaces ([PR #411](https://github.com/carbon-design-system/carbon-components-svelte/pull/411), [issue #409](https://github.com/carbon-design-system/carbon-components-svelte/issues/409))

## [0.23.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.23.1) - 2020-11-22

**Fixes**

- Fix `selected` prop reactivity in RadioButtonGroup so that it can be programmatically updated ([PR #407](https://github.com/carbon-design-system/carbon-components-svelte/pull/407), [issue #406](https://github.com/carbon-design-system/carbon-components-svelte/issues/406))
- Allow click propagation in ListBox so that list box menus can close correctly; this fixes behavior in the ComboBox, Dropdown, and MultiSelect components ([PR #405](https://github.com/carbon-design-system/carbon-components-svelte/pull/405), [issue #388](https://github.com/carbon-design-system/carbon-components-svelte/issues/388))

**Documentation**

- Add [programmatic RadioButton example](https://svelte.carbondesignsystem.com/components/RadioButton#programmatic-usage)
- Add [multiple ComboBox example](https://svelte.carbondesignsystem.com/components/ComboBox#multiple-combo-boxes)
- Add [multiple Dropdown example](https://svelte.carbondesignsystem.com/components/Dropdown#multiple-dropdowns)
- Add [multiple MultiSelect example](https://svelte.carbondesignsystem.com/components/MultiSelect#multiple-multi-select-dropdowns)
- Add [ExpandableAccordion recipe](https://svelte.carbondesignsystem.com/recipes/ExpandableAccordion#expandable-accordion)

## [0.23.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.23.0) - 2020-11-20

**Features**

- Persist UI Shell Header hamburger menu if `persistentHamburgerMenu` is `true` ([PR #396](https://github.com/carbon-design-system/carbon-components-svelte/pull/396), [issue #374](https://github.com/carbon-design-system/carbon-components-svelte/issues/374), [rendered example](https://svelte.carbondesignsystem.com/framed/UIShell/PersistedHamburgerMenu))
- Disable auto focus in ComposedModal if `selectorPrimaryFocus` is `null` ([PR #393](https://github.com/carbon-design-system/carbon-components-svelte/pull/393))
- Use small size Toggle variant if `size` is `"sm"`; deprecate ToggleSmall which will be removed in the next major release ([PR #401](https://github.com/carbon-design-system/carbon-components-svelte/pull/401))

**Fixes**

- Fix `currentIndex` reactivity in ProgressIndicator so that it can be programmatically updated ([PR #404](https://github.com/carbon-design-system/carbon-components-svelte/pull/404), [issue #399](https://github.com/carbon-design-system/carbon-components-svelte/issues/399))

**Refactoring**

- Rewrite TypeScript definitions with better type signatures for slots, dispatched events; fix IntrinsicAttributes errors ([PR #385](https://github.com/carbon-design-system/carbon-components-svelte/pull/385), [issue #304](https://github.com/carbon-design-system/carbon-components-svelte/issues/304))
- Remove useless if statement that wraps `svelte:component` in Button; by design, `svelte:component` will not render falsy values ([PR #402](https://github.com/carbon-design-system/carbon-components-svelte/pull/402))

**Documentation**

- Update auto-generated Component API documentation with output from [sveld](https://github.com/carbon-design-system/sveld)
- Label reactive component props and list them first
- Replace back ticks in Component API prop descriptions with a `code` tag ([PR #392](https://github.com/carbon-design-system/carbon-components-svelte/pull/392), [issue #390](https://github.com/carbon-design-system/carbon-components-svelte/issues/390))
- Simplify date sort method in ["Sortable with custom display and sort methods"](https://svelte.carbondesignsystem.com/components/DataTable#sortable-with-custom-display-and-sort-methods) DataTable example ([PR #382](https://github.com/carbon-design-system/carbon-components-svelte/pull/382))
- Add [programmatic ProgressIndicator](https://svelte.carbondesignsystem.com/components/ProgressIndicator#programmatic-usage) example
- Add [vertical ProgressIndicatorSkeleton](https://svelte.carbondesignsystem.com/components/ProgressIndicator#skeleton-vertical) example
- Add deprecation warning to the ToggleSmall component

**Housekeeping**

- Upgrade `carbon-icons-svelte` from version ^10.17 to ^10.21

**Breaking Changes**

- Internal component TypeScript interfaces are no longer exported to avoid polluting library exports

## [0.22.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.22.0) - 2020-10-30

**Features**

- Button: add "danger-tertiary", "danger-ghost" kinds
- OverflowMenu: support "sm", "xl" size variants
- TimePicker: support "sm", "xl" size variants
- Link: support "sm", "lg" size variants
- OrderedList: support native list styles
- MultiSelect: forward "clear" event
- MultiSelect: dispatch "select" event to be consistent with ComboBox, Dropdown

**Fixes**

- OverflowMenu: dynamic menu shadow width should be scoped to component instance; remove `tabindex` attribute from trigger button
- CodeSnippet: `showMoreLess` should be re-computed if `code` is dynamically updated

**Documentation**

- Document `itemToString` prop for Dropdown, MultiSelect
- MultiSelect: add example for "Initial selected items"
- CodeSnippet: add example for dynamically updating `code`
- CodeSnippet: add example for "Hidden code snippet" edge case (issue #373)
- OverflowMenu: add example for "Custom trigger icon"

**Housekeeping**

- upgrade `carbon-components` to v10.23.1, `@carbon/themes` to v10.22.1
- bump/patch development dependencies

## [0.21.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.21.0) - 2020-10-26

**Features**

- ListBoxMenu: forward "scroll" event ([PR #366](https://github.com/carbon-design-system/carbon-components-svelte/pull/366))
- ComboBox: export reference to list box menu ([PR #366](https://github.com/carbon-design-system/carbon-components-svelte/pull/366))
- DataTable: add `ToolbarMenu`, `ToolbarMenuItem` ([PR #369](https://github.com/carbon-design-system/carbon-components-svelte/pull/369))
- DataTable: support empty table body columns by adding optional `empty` key to `headers` prop ([PR #370](https://github.com/carbon-design-system/carbon-components-svelte/pull/370))
- Dropdown: support "sm", "xl" field sizes

**Fixes**

- DataTable: cancelling batch selection should deselect "select all rows" checkbox
- Toolbar: remove duplicate "bx--toolbar-content" element

**Documentation**

- DataTable: add example ["Empty column with overflow menu"](https://svelte.carbondesignsystem.com/components/DataTable#empty-column-with-overflow-menu)
- hand off current theme for examples opened in a new tab
- add field size examples for `Dropdown`, `MultiSelect`, `Select`

## [0.20.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.20.0) - 2020-10-24

**Features**

- DataTable: add `Toolbar`, `ToolbarContent`, `ToolbarSearch`, `ToolbarBatchActions`
- DataTable: support row selection, batch selection, radio selection
- DataTable: dispatch "mouseenter", "mouseleave" events on table rows
- Search: forward "focus", "blur" events to search input; dispatch "clear" event

**Fixes**

- DataTable: include sort direction with custom sort method ([PR #356](https://github.com/carbon-design-system/carbon-components-svelte/pull/356))
- fix: allow item ids in ComboBox, Dropdown, MultiSelect to be numbers
- fix(ui-shell): initialize `platformName` as empty string to prevent rendering as "undefined"

**Refactoring**

- refactor(ui-shell): remove redundant conditional in HeaderGlobalAction

**Documentation**

- new DataTable examples:
  - [With custom display and sort methods](https://svelte.carbondesignsystem.com/components/DataTable#with-custom-display-and-sort-methods)
  - [With toolbar](https://svelte.carbondesignsystem.com/components/DataTable#with-toolbar)
  - [With toolbar (small size)](https://svelte.carbondesignsystem.com/components/DataTable#with-toolbar-small-size)
  - [Selectable](https://svelte.carbondesignsystem.com/components/DataTable#selectable)
  - [Initial selected rows](https://svelte.carbondesignsystem.com/components/DataTable#initial-selected-rows)
  - [Selectable with batch actions](https://svelte.carbondesignsystem.com/components/DataTable#selectable-with-batch-actions)
  - [Selectable (radio)](https://svelte.carbondesignsystem.com/components/DataTable#selectable-radio)
- fix(docgen): list both default and named slots in `COMPONENT_INDEX.md`

## [0.19.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.19.0) - 2020-10-23

**Features**

- DataTable: add optional display and sort methods in header object ([PR #352](https://github.com/carbon-design-system/carbon-components-svelte/pull/352))
- ProgressIndicator: add preventChangeOnClick; default value is `false` ([PR #351](https://github.com/carbon-design-system/carbon-components-svelte/pull/351))
- TooltipDefinition: make tooltip text slottable through `slot="tooltip"`

**Fixes**

- ProgressIndicator: make `currentIndex` reactive ([PR #351](https://github.com/carbon-design-system/carbon-components-svelte/pull/351))
- ComposedModal: use `onDestroy` for destroy logic due to async usage of `onMount`([PR #348](https://github.com/carbon-design-system/carbon-components-svelte/pull/348))
- Search: forward `size` prop to Search skeleton

**Refactoring**

- TooltipDefinition: remove redundant `hidden` reactive variable

**Breaking Changes**

- ProgressIndicator: clicking a completed step will update `currentIndex`; to opt out of this default behavior, set `preventChangeOnClick` to `true`

**Documentation**

- ContentSwitcher: add "Selected index" example
- CodeSnippet: add multi-line skeleton example
- InlineLoading: add UX example showcasing various statuses

## [0.18.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.18.0) - 2020-10-17

**Features**

- DataTable: support individual, batch row expansion ([PR 341](https://github.com/carbon-design-system/carbon-components-svelte/pull/341))
- DataTable: make header, row cells slottable ([PR 342](https://github.com/carbon-design-system/carbon-components-svelte/pull/342))

**Fixes**

- fix(data-table): fix misaligned tall row table headers ([PR 340](https://github.com/carbon-design-system/carbon-components-svelte/pull/340))
- Documentation generator: parse `ArrayExpression` in exported props ([PR 341](https://github.com/carbon-design-system/carbon-components-svelte/pull/341))

**Breaking Changes**

- Remove top-level slot in `DataTable` in favor of named slots ([PR 341](https://github.com/carbon-design-system/carbon-components-svelte/pull/341))

**Documentation**

- add Component API metadata ([PR 340](https://github.com/carbon-design-system/carbon-components-svelte/pull/340))
- DataTable: add expandable, batch expandable examples ([PR 341](https://github.com/carbon-design-system/carbon-components-svelte/pull/341))
- DataTable: add slottable cells example ([PR 342](https://github.com/carbon-design-system/carbon-components-svelte/pull/342))

## [0.17.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.17.0) - 2020-10-16

**Features**

- feat: set `rel="nooopener noreferrer"` if `target="_blank"` on link components ([PR #321](https://github.com/carbon-design-system/carbon-components-svelte/pull/321))
- feat: support `Search` disabled state ([PR #330](https://github.com/carbon-design-system/carbon-components-svelte/pull/330))
- feat(button-skeleton): add size prop consistent with Button ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- feat(progress-indicator-skeleton): add count prop ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- feat(accordion): add disabled prop for `Accordion` and `AccordionItem` ([PR #333](https://github.com/carbon-design-system/carbon-components-svelte/pull/333))
- feat(accordion): add "sm", "xl" size variants to `Accordion` and `AccordionSkeleton` ([PR #333](https://github.com/carbon-design-system/carbon-components-svelte/pull/333))
- feat(content-switcher): add "sm", "xl" size variants ([PR #334](https://github.com/carbon-design-system/carbon-components-svelte/pull/334))
- feat(code-snippet): add wrapText prop for "multi" type CodeSnippet ([PR #335](https://github.com/carbon-design-system/carbon-components-svelte/pull/335))
- feat(aspect-ratio): add AspectRatio component ([PR #336](https://github.com/carbon-design-system/carbon-components-svelte/pull/336))
- feat(dropdown): dispatch select event, use window instead of body for click events ([PR #339](https://github.com/carbon-design-system/carbon-components-svelte/pull/339))

**Fixes**

- fix(combo-box): disabled combobox should not open ([PR #329](https://github.com/carbon-design-system/carbon-components-svelte/pull/329))
- fix(inline-loading): add wrapper class "bx--inline-loading" ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- fix(breadcrumb): forward noTrailingSlash to skeleton ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- fix(skeleton-text): unkey paragraph rows due to high collision rate ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))
- fix(accordion-skeleton): forward align prop ([PR #333](https://github.com/carbon-design-system/carbon-components-svelte/pull/333))

**Refactoring**

- refactor(icon): remove old logic that inferred icon size from function name ([PR #332](https://github.com/carbon-design-system/carbon-components-svelte/pull/332))

**Documentation**

- AspectRatio (new component): demo all ratios
- Breadcrumb: use `noTrailingSlash` in skeleton example
- Button: demo skeleton size variants
- CodeSnippet: add example "Wrap text"
- ComboBox: add examples "Light variant," "Filterable"
- ContentSwitcher: add examples "Extra-large size" and "Small size"
- SkeletonText: add example "Paragraph with custom line count"
- Pagination: add example "Hidden page size"
- ProgressIndicator: demo custom step count for skeleton
- Link: add example `Target _blank`
- MultiSelect: add example "No alphabetical sorting"
- Accordion: add examples for "Extra-large" and "Small" size variants
- Accordion: add examples for "Disabled" and "Disabled (item)"
- AccordionSkeleton: add examples "Skeleton (chevron aligned left)" and size variants

**Housekeeping**

- chore(deps-dev): bump carbon-components to ^v10.22 ([PR #337](https://github.com/carbon-design-system/carbon-components-svelte/pull/337))
- retire Storybook by removing Storybook-related dependencies, set-up and stories ([PR #331](https://github.com/carbon-design-system/carbon-components-svelte/pull/331))
- use `npm-run-all` to run `build:css` and `build:lib` in parallel ([PR #331](https://github.com/carbon-design-system/carbon-components-svelte/pull/331))

## [0.16.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.16.0) - 2020-10-12

**Features**

- Pagination: add `pageSizeInputDisabled` prop to hide page size buttons (default is `false`) ([PR #292](https://github.com/carbon-design-system/carbon-components-svelte/pull/292))
- ListBoxMenu: add `ref` prop ([PR #303](https://github.com/carbon-design-system/carbon-components-svelte/pull/303))
- Pre-compiled CSS: upgrade `carbon-components` to version 10.21

**Fixes**

- Link: explicitly define `href` prop to fix TypeScript errors ([PR #301](https://github.com/carbon-design-system/carbon-components-svelte/pull/301))
- RadioButtonGroup: explicitly define `id` prop to fix TypeScript errors ([PR #303](https://github.com/carbon-design-system/carbon-components-svelte/pull/303))
- ComboBox: `light` prop should use the light variant ([PR #303](https://github.com/carbon-design-system/carbon-components-svelte/pull/303))
- ComposedModal: class "bx--body--with-modal-open" should be removed when closing the modal ([PR #306](https://github.com/carbon-design-system/carbon-components-svelte/pull/306))
- Dropdown: remove unused `setContext` import ([PR #308](https://github.com/carbon-design-system/carbon-components-svelte/pull/308))
- `css/all.css`: default theme should be "white," not "g10" ([PR #322](https://github.com/carbon-design-system/carbon-components-svelte/pull/322))
- UI Shell: `HeaderAction` menu should close when clicking in the window, not just the document body ([PR #323](https://github.com/carbon-design-system/carbon-components-svelte/pull/323))

**Performance**

- DatePicker: remove default i10n locales import to reduce bundle size by ~42 kB ([PR #316](https://github.com/carbon-design-system/carbon-components-svelte/pull/316))

**Breaking Changes**

- DatePicker: default i10n locales are no longer imported
- if using `css/all.css`, set the "theme" attribute on the HTML element to "g10" in order to use the Gray 10 theme

**Documentation**

- Redesign component [documentation website](https://svelte.carbondesignsystem.com/)
- Update development workflow in `CONTRIBUTING.md`
- Typo fixes in `README.md` ([PR #324](https://github.com/carbon-design-system/carbon-components-svelte/pull/324), [PR #325](https://github.com/carbon-design-system/carbon-components-svelte/pull/325))

**Housekeeping**

- Git hooks: only lint staged files in the pre-commit Git hook ([PR #319](https://github.com/carbon-design-system/carbon-components-svelte/pull/319))

## [0.15.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.15.0) - 2020-10-01

**Features**

- DataTableSkeleton: add `size` prop to support "compact", "small", "tall" row heights ([PR #279](https://github.com/carbon-design-system/carbon-components-svelte/pull/279), thanks [@albertms10](https://github.com/albertms10))

- HeaderPanelLink: forward click event ([PR #286](https://github.com/carbon-design-system/carbon-components-svelte/pull/286), thanks [@weaseldotro](https://github.com/weaseldotro))

- FluidForm: add `FluidForm` component and support fluid variants for `TextInput`, `PasswordInput` ([PR #293](https://github.com/carbon-design-system/carbon-components-svelte/pull/293), thanks [@josefaidt](https://github.com/josefaidt))

- UI Shell: add `ref` prop to interactive (i.e., anchor links, buttons) UI Shell elements ([PR #297](https://github.com/carbon-design-system/carbon-components-svelte/pull/297), thanks [@josefaidt](https://github.com/josefaidt))

**Fixes**

- Slider: attach mousemove/touch events to document body, not slider input ([issue #288](https://github.com/carbon-design-system/carbon-components-svelte/issues/288))

- Slider: `value` prop type should be a `number`, not a `string` ([issue #289](https://github.com/carbon-design-system/carbon-components-svelte/issues/289))

- Slider: input value should not update if `disabled` is `true`

- Slider: `change` event should only be dispatched if the value changes

- UI Shell: correctly bind `ref` prop in `HeaderGlobalAction` ([PR #297](https://github.com/carbon-design-system/carbon-components-svelte/pull/297), thanks [@josefaidt](https://github.com/josefaidt))

- export `DatePickerSkeleton`, `FileUploaderSkeleton` components

**Breaking Changes**

- DataTableSkeleton: `compact` prop is removed in favor of `size="compact"`

**Dependencies**

- upgrade `carbon-icons-svelte` to version ^10.17.0

**Housekeeping**

- prettier: enable `svelteBracketNewLine` for improved readability ([PR #281](https://github.com/carbon-design-system/carbon-components-svelte/pull/281), thanks [@josefaidt](https://github.com/josefaidt))

- git: add husky, lint-staged to development workflow ([PR #295](https://github.com/carbon-design-system/carbon-components-svelte/pull/295), thanks [@josefaidt](https://github.com/josefaidt))

## [0.14.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.14.0) - 2020-09-23

**Features**

- `Modal`, `ComposedModal`: add `preventCloseOnClickOutside` prop
- `Modal`: add `alert` prop to support alertdialog ARIA role ([PR #273](https://github.com/carbon-design-system/carbon-components-svelte/pull/273), thanks [@josefaidt](https://github.com/josefaidt))
- `TextInput`: add `warn` prop ([PR #275](https://github.com/carbon-design-system/carbon-components-svelte/pull/275), thanks [@josefaidt](https://github.com/josefaidt))
- `TextInput`: add `inline` prop ([PR #277](https://github.com/carbon-design-system/carbon-components-svelte/pull/277), thanks [@josefaidt](https://github.com/josefaidt))

**Fixes**

- `DataTableSkeleton`: add `showHeader`, `showToolbar` props
- `OverflowMenu`: focus menu button on escape key only
- `DataTable`: fix `headers` JSDoc type annotation ([PR #271](https://github.com/carbon-design-system/carbon-components-svelte/pull/271), thanks [@albertms10](https://github.com/albertms10))

**Breaking Changes**

- `DataTableSkeleton`: `showHeader` and `showToolbar` are `true` by default

## [0.13.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.13.0) - 2020-09-18

**Features**

- Move helper text below form inputs in `ComboBox`, `Dropdown`, `MultiSelect`, `TextArea`, `NumberInput`, `TextInput`, `Select` ([PR #256](https://github.com/carbon-design-system/carbon-components-svelte/pull/256), [issue #255](https://github.com/carbon-design-system/carbon-components-svelte/issues/255))

- ProgressIndicator: add `spaceEqual` prop and functionality ([PR #263](https://github.com/carbon-design-system/carbon-components-svelte/pull/263), [issue #262](https://github.com/carbon-design-system/carbon-components-svelte/issues/262))

**Fixes**

- Link: remove visited styles by default ([PR #259](https://github.com/carbon-design-system/carbon-components-svelte/pull/259), [issue #258](https://github.com/carbon-design-system/carbon-components-svelte/issues/258))

- TimePickerSelect: deprecate `hideLabel` prop to match spec and set default value to `true` ([PR #261](https://github.com/carbon-design-system/carbon-components-svelte/pull/261), [issue #260](https://github.com/carbon-design-system/carbon-components-svelte/issues/260))

**Breaking Changes**

- TimePickerSelect: `hideLabel` prop is `true` by default

## [0.12.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.12.3) - 2020-09-16

**Fixes**

- ClickableTile: add missing `href` ([PR #254](https://github.com/carbon-design-system/carbon-components-svelte/pull/254), thanks [@josefaidt](https://github.com/josefaidt))

## [0.12.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.12.2) - 2020-09-14

**Fixes**

- Dropdown: allow event propagation when clicking the chevron icon (73861e2)

## [0.12.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.12.1) - 2020-09-14

**Fixes**

- Pagination: ensure `page`, `pageSize` values are numbers (0138910)
- Pagination: dispatch "update" event only when `pageSize` or `page` values update (458d1b5)
- Pagination: use correct size carbon icons for buttons (size `16` instead of `24`) (192f98d)
- ProgressStep: use button element; set negative `tabindex` if `disabled` is `true` (3202f39)
- ProgressStep: forward click event (6cb877e)
- SideNavMenu, SideNavMenuItem: remove "role", "aria-haspopup" attributes causing a11y warnings
- RadioTile: move `keydown`, `tabindex` to input element (17d97d1)

## [0.12.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.12.0) - 2020-09-13

**Features**

- css: ship pre-compiled CSS StyleSheets for each Carbon theme (70e0875)

**Documentation**

- examples: add example set-ups using popular bundlers/frameworks
- update README guidance on consuming the library

## [0.11.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.11.0) - 2020-09-05

**Features**

- UI Shell: add `HeaderGlobalAction` component (7b3c111)

## [0.10.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.10.0) - 2020-09-05

**Features**

- UI Shell: add Close/AppSwitcher as default icons for `HeaderAction` component (5f62cde)
- ButtonSet: add `stacked` prop (c8e0a59)
- Link: set `rel` attribute to "noopener noreferrer" if `target` is "\_blank" (4b7d254)

**Fixes**

- TextInput: add missing `required` prop to input (PR #237), thanks [@kamil-murtaza](https://github.com/kamil-murtaza))
- StructuredList: change element semantics from `section` to `div` to avoid accessibility error (117dbcf)
- MultiSelect: add `light` variant to text input (6a955b1)
- NumberInput: disable label, helper text if `disabled` is set to `true` (37c7f07)
- Pagination: use singular page range text if `total` is 1 (3d64fb2)

**Housekeeping**

- add `.prettierrc` and enable `svelteStrictMode` (42b8159)
- remove documentation of non-existent `small` Button prop (41a533d)
- upgrade TypeScript to version >=4 (e7e67f3)
- bump prettier, prettier-plugin-svelte (322b238)
- bump rollup, rollup plugins (00b9068)
- require node >=12 for development/CI (bf0f11a)

## [0.9.7](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.7) - 2020-08-23

- Fix `InlineNotification` and `ToastNotification` timeout
  ([PR#235](https://github.com/carbon-design-system/carbon-components-svelte/pull/235), thanks [@Overbryd](https://github.com/Overbryd))

## [0.9.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.6) - 2020-08-15

- use svelte compiler to generate TypeScript definitions, documentation (issue #227, PR #228)
- fix `DatePicker` to use default imports (reverts 6d5f1e5; issue #232)

## [0.9.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.5) - 2020-08-12

- fix `Modal` and `ComposedModal` to prevent modal from closing unexpectedly ([PR #231](https://github.com/carbon-design-system/carbon-components-svelte/pull/231))

## [0.9.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.4) - 2020-08-08

- ignore false positive `a11y-label-has-associated-control` warnings added in svelte^v3.24.1
- fix `DatePicker`: use wildcard import to resolve flatpickr "no default" error when using ESM
- allow `CodeSnippet` button to be optional by using the `hideCopyButton` prop
- refactor `CodeSnippet`: replace afterUpdate with reactive statement
- fix `CodeSnippet`: forward `feedback`, `feedbackTimeout` props to `Copy` component

## [0.9.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.3) - 2020-08-02

- rename UI Shell `Header` slot from "skip-to-main-content" to "skip-to-content"
- support fixed `SideNav`
- add `expandedByDefault` prop to `Header` to prevent `SideNav` from being expanded

## [0.9.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.2) - 2020-08-01

- add "skip-to-main-content" slot to `Header`
- make `platformName` prop in UI Shell `Header` slottable (i.e., <span slot="platform">...</span>)
- make `company` prop `Header` optional
- fix UI Shell `Header` to add space between company and platform name for ARIA label
- fix UI Shell `HeaderAction` bug where panel would not open
- add `ButtonSet` component
- fix `Accordion` to avoid `$$restProps.class` override

## [0.9.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.1) - 2020-07-30

- fix `TabContent` to remove hidden prop when panel is selected

## [0.9.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.9.0) - 2020-07-30

- add TypeScript definitions
- dispatch "select" and "clear" events in `ComboBox`
- forward `keydown` event to `TextInput`, `PasswordInput` components
- add `count` prop to `TabsSkeleton`
- apply toggle behavior to `HeaderAction` button; dispatch "open" and "close" events
- fix forwarded click event in `CodeSnippet`
- fix class name typo in `UnorderedList`

## [0.8.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.5) - 2020-07-23

- add `noGutter`, `noGutterLeft`, `noGutterRight` props to `Grid`, `Row`, `Column`
- add `aspectRatio` prop to `Column`

## [0.8.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.4) - 2020-07-22

- add Grid components (`Grid`, `Row`, `Column`)
- add `PaginationNav` component
- fix `TooltipIcon` to avoid `$$restProps.class` override

## [0.8.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.3) - 2020-07-20

- bump `carbon-icons-svelte` dependency to version >=10.14.0
- support `size` prop (`undefined` or `"sm"` or `"lg`) in `DatePickerInput`, `NumberInput`, `Select`, `PasswordInput`, `TextInput` components
- support light variant for `ContentSwitcher`
- focus `ComboBox` after clearing the selection
- fix `ListBox` regression where size class can be overriden by `$$restProps.class`
- fix `Pagination` regression where current page selection value is stuck at `1`

## [0.8.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.2) - 2020-07-19

- fix `ComboBox` to close dropdown menu when pressing the "Escape" key ([Issue #198](https://github.com/carbon-design-system/carbon-components-svelte/issues/198))

## [0.8.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.1) - 2020-07-19

- fix bug in `Tag` to prevent custom class from overriding tag class
- fix SSR rendering issue in `Modal` by replacing `onDestroy` with `onMount` ([Issue #200](https://github.com/carbon-design-system/carbon-components-svelte/issues/200))

## [0.8.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.8.0) - 2020-07-19

- use \$\$restProps API (requires Svelte version >=3.20)
- upgrade `carbon-icons-svelte` to version >=10.13.0
- use svelte class:{value} API instead of `cx`
- add ref prop to "interactive" components like text inputs, anchor links... ([Issue #196](https://github.com/carbon-design-system/carbon-components-svelte/issues/196))
- add slot to Content Switcher `Switch` component ([Issue #183](https://github.com/carbon-design-system/carbon-components-svelte/issues/183))
- fix `ContentSwitcher` bug where bound `selectedIndex` could not be updated
- remove unused lib utilities (cx, css, fillArray)
- refactor component exports and folder structure
- create Sapper app for e2e testing and alternative development environment in `docs/`
- update Travis CI config to build library, build storybook, and run e2e tests in `docs/`
- remove Jest in favor of integration/e2e testing with Cypress
- update contributing guidelines

## [0.7.6](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.6) - 2020-07-19

- Add named slot to UI Shell `HeaderAction` component for text
  ([PR#201](https://github.com/carbon-design-system/carbon-components-svelte/pull/201), thanks [@danielboven](https://github.com/danielboven))

## [0.7.5](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.5) - 2020-07-17

- Add `name` prop to form-related components
  ([PR#199](https://github.com/carbon-design-system/carbon-components-svelte/pull/199), thanks [@softartisan](https://github.com/softartisan))

- Add `Content`, `SkipToContent` components to the UI Shell

- Forward `on:click` event to UI Shell `Header` component

## [0.7.4](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.4) - 2020-06-17

- Fix `OverflowMenu` focus behavior to set `didOpen` only if `open` is true ([PR#193](https://github.com/carbon-design-system/carbon-components-svelte/pull/193))

## [0.7.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.3) - 2020-06-16

- Fix `OverflowMenu` to focus button only after closing the menu ([PR#192](https://github.com/carbon-design-system/carbon-components-svelte/pull/192))

## [0.7.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.2) - 2020-06-04

- Add sort direction to dispatched "click:header" event for a sortable `DataTable`
  ([PR#188](https://github.com/carbon-design-system/carbon-components-svelte/pull/188), thanks [@mabentley85](https://github.com/mabentley85)!)

## [0.7.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.1) - 2020-06-03

- Add missing RadioTile export

## [0.7.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.7.0) - 2020-05-29

- Dispatch "update" event in `Pagination` for `pageSize`, `page` variables
  ([PR#185](https://github.com/carbon-design-system/carbon-components-svelte/pull/185), thanks [@mabentley85](https://github.com/mabentley85)!)

- Drop carbon-components as a peer dependency

## [0.6.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.6.3) - 2020-05-26

- Replace `"javascript:void(0)"` with `"/"` in `HeaderNavMenu` href attribute to fix a11y "not a valid attribute" warning; `href` is an exported property that can be overriden by the consumer
  ([Issue #184](https://github.com/carbon-design-system/carbon-components-svelte/issues/184))

- Ignore `a11y-no-onchange` warning in `TimePickerSelect`

- Bump development dependency `svelte` to v3.23.0

## [0.6.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.6.2) - 2020-05-09

- Fix `tileMaxHeight` bug in `ExpandableTile` by setting the value only if the default value is 0
  ([Issue #180](https://github.com/carbon-design-system/carbon-components-svelte/issues/180))

## [0.6.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.6.1) - 2020-05-08

- Fix `Pagination` bug by binding the correct variable (`selected`) to the `Select` component
  ([PR#179](https://github.com/carbon-design-system/carbon-components-svelte/pull/179), thanks [@ericol](https://github.com/ericol)!)

## [0.6.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.6.0) - 2020-05-07

- Fix button with icon bug by manually setting `hasIconOnly` in `Button`. This results in a breaking change for icon-only buttons, which now must include `hasIconOnly`
  ([Issue #174](https://github.com/carbon-design-system/carbon-components-svelte/issues/174))

## [0.5.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.5.1) - 2020-05-03

- Fix focus/dispatch bug in `Modal`, `ComposedModal`
  ([PR#173](https://github.com/carbon-design-system/carbon-components-svelte/pull/173), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.5.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.5.0) - 2020-04-29

- Ship `DataTable` that supports sorting

- Pin dependencies, remove commitlint, husky, eslint, prettier

## [0.4.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.4.2) - 2020-04-20

- Forward `on:blur` event to Select component
  ([PR#169](https://github.com/carbon-design-system/carbon-components-svelte/pull/169), thanks [@httpsOmkar](https://github.com/httpsOmkar)!)

## [0.4.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.4.1) - 2020-04-18

- Refactor UI Shell components to be modular (header, left panel, right panel)
  ([PR#168](https://github.com/carbon-design-system/carbon-components-svelte/pull/168), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.4.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.4.0) - 2020-04-18

- Refactor UI Shell to be component-based
  ([PR#166](https://github.com/carbon-design-system/carbon-components-svelte/pull/166), thanks [@mfeitoza](https://github.com/mfeitoza)!)

## [0.3.3](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.3.3) - 2020-03-09

- Fix "window is undefined" error when using UIShell with server-side rendering (SSR)
  ([PR#149](https://github.com/carbon-design-system/carbon-components-svelte/pull/149), thanks [@pbxothi](https://github.com/pbxothi)!)

## [0.3.2](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.3.2) - 2020-02-12

- Fix `SkeletonText` duplicate style attribute to work with `svelte^3.18.2`
  ([#134](https://github.com/carbon-design-system/carbon-components-svelte/issues/134))

## [0.3.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.3.1) - 2020-02-03

- Fix `DatePicker` locale initialization bug

- Fix `CheckboxSkeleton` styles; bump `carbon-components` version to ^10.9.3

## [0.3.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.3.0) - 2020-02-03

- Add `UIShell` component (thanks [@Heydan83](https://github.com/Heydan83)!)
  ([#10](https://github.com/carbon-design-system/carbon-components-svelte/issues/10))

- Add single component skeleton states for `Accordion`, `CodeSnippet`

- Fix `Select`, `SelectItem` to support two-way binding, programmatic prop setting

- Fix `Tab` to set `selected` prop to `currentIndex` after updating

## [0.2.1](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.2.1) - 2020-01-08

- Check if `l10n.en` is defined in `DatePicker` component to resolve Svelte REPL compilation

## [0.2.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.2.0) - 2020-01-08

- Include `src` in files published to npm to resolve Svelte module entry
  ([#102](https://github.com/carbon-design-system/carbon-components-svelte/issues/102))

- Support most Carbon components (See the [GitHub project](https://github.com/carbon-design-system/carbon-components-svelte/projects/1))

## [0.1.0](https://github.com/carbon-design-system/carbon-components-svelte/releases/tag/v0.1.0) - 2019-12-15

- Initial release
