import { render, screen } from "@testing-library/svelte";
import { makeFile, simulateFileSelection } from "../FileUploader/helpers";
import { user } from "../utils/user";
import TranslatableStrings from "./TranslatableStrings.test.svelte";

/** Every assistive string a component builds can be replaced. */
describe("translatable strings", () => {
  it("BigNumber reads totalSeparatorText in place of the slash", () => {
    const { container } = render(TranslatableStrings, {
      props: { example: "BigNumber" },
    });

    const denominator = container.querySelector(".bx--big-number__denominator");
    expect(
      denominator?.querySelector(".bx--visually-hidden"),
    ).toHaveTextContent("von");
  });

  it("DataTable names its expand and select controls with translateWithId", async () => {
    render(TranslatableStrings, { props: { example: "DataTable" } });

    const expandAll = screen.getByRole("button", {
      name: "Alle Zeilen erweitern",
    });
    expect(
      screen.getByRole("button", { name: "Zeile erweitern" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Alle Zeilen auswählen" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Zeile auswählen" }),
    ).toBeInTheDocument();

    await user.click(expandAll);
    expect(
      screen.getByRole("button", { name: "Alle Zeilen reduzieren" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Zeile reduzieren" }),
    ).toBeInTheDocument();
  });

  it("FileUploaderButton labels a multi-file pick with fileCountText", async () => {
    const { container } = render(TranslatableStrings, {
      props: { example: "FileUploaderButton" },
    });

    const input = container.querySelector('input[type="file"]');
    assert(input instanceof HTMLInputElement);
    simulateFileSelection(input, [makeFile("a.txt"), makeFile("b.txt")]);

    await vi.waitFor(() => {
      expect(screen.getByRole("button")).toHaveTextContent("2 Dateien");
    });
  });

  it("InterstitialScreenHeader announces the step with stepText and labels untitled steps with stepLabelText", () => {
    const { container } = render(TranslatableStrings, {
      props: { example: "InterstitialScreen" },
    });

    expect(screen.getByText("Schritt 1 von 2")).toBeInTheDocument();
    expect(
      Array.from(
        container.querySelectorAll(".bx--progress-label"),
        (label) => label.textContent,
      ),
    ).toEqual(["Eins", "Schritt 2"]);
  });

  it("MultiSelect describes the selection with selectionCountText", () => {
    render(TranslatableStrings, { props: { example: "MultiSelect" } });

    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      /^2 ausgewählt\./,
    );
  });

  it("PaginationNav names pages and announces the range with pageText and pageRangeText", () => {
    render(TranslatableStrings, { props: { example: "PaginationNav" } });

    expect(screen.getByRole("button", { name: "Seite 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Seite 1 von 20")).toBeInTheDocument();
    expect(screen.getByLabelText("Seite wählen")).toBeInTheDocument();
  });

  it("ProgressIndicator appends statusText to complete and invalid steps", () => {
    render(TranslatableStrings, { props: { example: "ProgressIndicator" } });

    expect(
      screen.getByRole("button", { name: /Konto.*, erledigt/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Adresse.*, ungültig/ }),
    ).toBeInTheDocument();
  });

  it("Search describes its spinner with loadingDescription", () => {
    const { container } = render(TranslatableStrings, {
      props: { example: "Search" },
    });

    expect(
      container.querySelector(".bx--search-magnifier title"),
    ).toHaveTextContent("Wird gesucht");
  });

  it("Tabs names each dismiss button with dismissText", () => {
    render(TranslatableStrings, { props: { example: "Tabs" } });

    expect(
      screen.getByRole("button", { name: "Zwei schließen" }),
    ).toBeInTheDocument();
  });
});
