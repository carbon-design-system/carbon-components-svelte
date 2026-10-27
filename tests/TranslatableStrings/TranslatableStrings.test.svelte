<script lang="ts">
  import BigNumber from "carbon-components-svelte/BigNumber/BigNumber.svelte";
  import DataTable from "carbon-components-svelte/DataTable/DataTable.svelte";
  import FileUploaderButton from "carbon-components-svelte/FileUploader/FileUploaderButton.svelte";
  import InterstitialScreen from "carbon-components-svelte/InterstitialScreen/InterstitialScreen.svelte";
  import InterstitialScreenBody from "carbon-components-svelte/InterstitialScreen/InterstitialScreenBody.svelte";
  import InterstitialScreenHeader from "carbon-components-svelte/InterstitialScreen/InterstitialScreenHeader.svelte";
  import InterstitialScreenView from "carbon-components-svelte/InterstitialScreen/InterstitialScreenView.svelte";
  import MultiSelect from "carbon-components-svelte/MultiSelect/MultiSelect.svelte";
  import PaginationNav from "carbon-components-svelte/PaginationNav/PaginationNav.svelte";
  import ProgressIndicator from "carbon-components-svelte/ProgressIndicator/ProgressIndicator.svelte";
  import ProgressStep from "carbon-components-svelte/ProgressIndicator/ProgressStep.svelte";
  import Search from "carbon-components-svelte/Search/Search.svelte";
  import Tab from "carbon-components-svelte/Tabs/Tab.svelte";
  import Tabs from "carbon-components-svelte/Tabs/Tabs.svelte";

  export let example:
    | "BigNumber"
    | "DataTable"
    | "FileUploaderButton"
    | "InterstitialScreen"
    | "MultiSelect"
    | "PaginationNav"
    | "ProgressIndicator"
    | "Search"
    | "Tabs";

  const dataTable = {
    expandAll: "Alle Zeilen erweitern",
    collapseAll: "Alle Zeilen reduzieren",
    expandRow: "Zeile erweitern",
    collapseRow: "Zeile reduzieren",
    expandColumn: "Zeilen erweitern",
    selectAll: "Alle Zeilen auswählen",
    selectRow: "Zeile auswählen",
  } as const;
</script>

{#if example === "BigNumber"}
  <BigNumber
    labelText="Aufgaben"
    value={12}
    total={20}
    totalSeparatorText="von"
  />
{:else if example === "DataTable"}
  <DataTable
    expandable
    batchExpansion
    selectable
    batchSelection
    headers={[{ key: "name", value: "Name" }]}
    rows={[{ id: "a", name: "Alpha" }]}
    translateWithId={(id) => dataTable[id]}
  />
{:else if example === "FileUploaderButton"}
  <FileUploaderButton
    multiple
    labelText="Dateien hinzufügen"
    fileCountText={(count) => `${count} Dateien`}
  />
{:else if example === "InterstitialScreen"}
  <InterstitialScreen open>
    <InterstitialScreenHeader
      stepText={(step, total) => `Schritt ${step} von ${total}`}
      stepLabelText={(step) => `Schritt ${step}`}
    />
    <InterstitialScreenBody>
      <InterstitialScreenView stepTitle="Eins">Inhalt 1</InterstitialScreenView>
      <InterstitialScreenView>Inhalt 2</InterstitialScreenView>
    </InterstitialScreenBody>
  </InterstitialScreen>
{:else if example === "MultiSelect"}
  <MultiSelect
    labelText="Kontakt"
    items={[
      { id: "a", text: "E-Mail" },
      { id: "b", text: "Telefon" },
    ]}
    selectedIds={["a", "b"]}
    selectionCountText={(count) => `${count} ausgewählt`}
  />
{:else if example === "PaginationNav"}
  <PaginationNav
    total={20}
    pageText={(page) => `Seite ${page}`}
    pageRangeText={(_current, total) => `von ${total}`}
    pageSelectLabelText={() => "Seite wählen"}
  />
{:else if example === "ProgressIndicator"}
  <ProgressIndicator
    currentIndex={1}
    statusText={(status) => (status === "complete" ? "erledigt" : "ungültig")}
  >
    <ProgressStep complete label="Konto" />
    <ProgressStep invalid label="Adresse" />
  </ProgressIndicator>
{:else if example === "Search"}
  <Search labelText="Suche" loading loadingDescription="Wird gesucht" />
{:else if example === "Tabs"}
  <Tabs dismissible dismissText={(label) => `${label} schließen`}>
    <Tab label="Eins" />
    <Tab label="Zwei" />
  </Tabs>
{/if}
