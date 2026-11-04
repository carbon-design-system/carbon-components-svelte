import { render, screen, waitFor } from "@testing-library/svelte";
import { user } from "../utils/user";
import ImportWizard from "./ImportWizard.test.svelte";

const csv = [
  "Customer,E-mail,Role",
  "Ada Lovelace,ada@example.com,admin",
  "Grace Hopper,grace@example,member",
  "Alan Turing,alan@example.com,Superuser",
  "Ada Again,ADA@example.com,member",
  "Edsger Dijkstra,edsger@example.com,member",
].join("\n");

async function upload(text = csv, name = "users.csv") {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error("no file input");
  await user.upload(input, new File([text], name, { type: "text/csv" }));
}

const next = () => user.click(screen.getByRole("button", { name: "Continue" }));

async function toReview() {
  await upload();
  await waitFor(() =>
    expect(screen.getByText(/5 rows, 3 columns/)).toBeInTheDocument(),
  );
  await next();
  await screen.findByText("Match each column to a field");
  await next();
  await screen.findByText("2 valid");
}

describe("ImportWizard", () => {
  it("reads the file and shows what it found", async () => {
    render(ImportWizard);
    await upload();
    expect(await screen.findByText(/5 rows, 3 columns/)).toBeInTheDocument();
    expect(screen.getByText(/Comma-separated, UTF-8/)).toBeInTheDocument();
  });

  it("matches the columns on its own and marks how", async () => {
    render(ImportWizard);
    await upload();
    await screen.findByText(/5 rows/);
    await next();
    expect(await screen.findByText("Matched by alias")).toBeInTheDocument();
    expect(screen.getAllByText("Matched").length).toBeGreaterThan(0);
  });

  it("blocks Continue until every required field has a column", async () => {
    render(ImportWizard);
    await upload("Foo,Bar\n1,2");
    await screen.findByText(/1 rows|1 row/);
    await next();
    expect(
      await screen.findByText(
        "Map these required fields to continue: Full name, Email",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("counts valid rows, errors and duplicates in the review", async () => {
    render(ImportWizard);
    await toReview();
    expect(screen.getByText("2 valid")).toBeInTheDocument();
    expect(screen.getByText("2 with errors")).toBeInTheDocument();
    expect(screen.getByText("1 duplicates")).toBeInTheDocument();
  });

  it("fixes a cell in place and drops the row from the errors list", async () => {
    render(ImportWizard);
    await toReview();
    const input = screen.getByRole("textbox", { name: "Email, row 3" });
    await user.clear(input);
    await user.type(input, "grace@example.com{Enter}");
    await user.tab();
    await waitFor(() =>
      expect(screen.getByText("3 valid")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("textbox", { name: "Email, row 3" })).toBeNull();
  });

  it("imports the valid rows in chunks and reports the result", async () => {
    const imported: unknown[] = [];
    const onResult = vi.fn();
    render(ImportWizard, { imported, onResult });
    await toReview();
    await next();
    await user.click(
      await screen.findByRole("button", { name: "Import 2 rows" }),
    );
    expect(await screen.findByText("Imported 2 rows")).toBeInTheDocument();
    expect(imported).toEqual([
      { name: "Ada Lovelace", email: "ada@example.com", role: "admin" },
      { name: "Edsger Dijkstra", email: "edsger@example.com", role: "member" },
    ]);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ imported: 2, canceled: false }),
    );
    expect(
      screen.getByRole("button", { name: "Download rows not imported" }),
    ).toBeInTheDocument();
  });

  it("reports the rows of a chunk that failed", async () => {
    render(ImportWizard, { fail: true, chunkSize: 1 });
    await toReview();
    await next();
    await user.click(
      await screen.findByRole("button", { name: "Import 2 rows" }),
    );
    expect(
      await screen.findByText("Imported 1 rows, 1 failed"),
    ).toBeInTheDocument();
  });
});
