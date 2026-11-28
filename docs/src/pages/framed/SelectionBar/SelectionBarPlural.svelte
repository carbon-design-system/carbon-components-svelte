<script>
  import {
    Button,
    Checkbox,
    Select,
    SelectionBar,
    SelectItem,
    Stack,
  } from "carbon-components-svelte";
  import Download from "carbon-icons-svelte/lib/Download.svelte";

  // One message per plural category the locale uses.
  const messages = {
    en: {
      selected: {
        one: "{count} file selected",
        other: "{count} files selected",
      },
      clear: "Deselect all",
      download: "Download",
    },
    fr: {
      selected: {
        one: "{count} fichier sélectionné",
        other: "{count} fichiers sélectionnés",
      },
      clear: "Tout désélectionner",
      download: "Télécharger",
    },
    pl: {
      selected: {
        one: "{count} plik zaznaczony",
        few: "{count} pliki zaznaczone",
        many: "{count} plików zaznaczonych",
        other: "{count} pliku zaznaczonego",
      },
      clear: "Odznacz wszystko",
      download: "Pobierz",
    },
  };

  const files = [
    "invoice-2026-01.pdf",
    "invoice-2026-02.pdf",
    "invoice-2026-03.pdf",
    "invoice-2026-04.pdf",
    "invoice-2026-05.pdf",
    "invoice-2026-06.pdf",
  ];

  let locale = "pl";
  let selected = files.slice(0, 3);

  $: t = messages[locale];
  $: pluralRules = new Intl.PluralRules(locale);
  $: numberFormat = new Intl.NumberFormat(locale);
  $: selectedText = (count) =>
    t.selected[pluralRules.select(count)].replace(
      "{count}",
      numberFormat.format(count),
    );

  function toggle(file, checked) {
    selected = checked
      ? [...selected, file]
      : selected.filter((selectedFile) => selectedFile !== file);
  }
</script>

<Stack gap={5}>
  <Select labelText="Language" bind:selected={locale}>
    <SelectItem value="en" text="English" />
    <SelectItem value="fr" text="Français" />
    <SelectItem value="pl" text="Polski" />
  </Select>
  <SelectionBar
    lang={locale}
    count={selected.length}
    {selectedText}
    clearText={t.clear}
    on:clear={() => (selected = [])}
  >
    <svelte:fragment slot="actions">
      <Button icon={Download}>{t.download}</Button>
    </svelte:fragment>
  </SelectionBar>
  <fieldset>
    <legend class="bx--label">Invoices</legend>
    {#each files as file (file)}
      <Checkbox
        labelText={file}
        checked={selected.includes(file)}
        on:check={(event) => toggle(file, event.detail)}
      />
    {/each}
  </fieldset>
</Stack>
