// @vitest-environment node
import FilePreview from "carbon-components-svelte/FilePreview/FilePreview.svelte";
import { renderSSR } from "../utils/ssr";

describe("FilePreview server render", () => {
  it("renders the file card: the name, type and size, a spinner, and a download for a src", () => {
    const { document } = renderSSR(FilePreview, {
      id: "ticket",
      src: "https://files.example/q3/report.pdf",
      type: "application/pdf",
    });

    const region = document.querySelector("section");
    expect(region?.getAttribute("aria-labelledby")).toBe("ticket-name");
    expect(region?.getAttribute("aria-busy")).toBe("true");
    expect(document.querySelector("#ticket-name")?.textContent).toBe(
      "report.pdf",
    );
    expect(
      document.querySelector(".bx--file-preview__meta")?.textContent,
    ).toContain("PDF");
    expect(document.querySelector(".bx--file-preview__card")).not.toBeNull();
    expect(document.querySelector("a[download]")?.getAttribute("href")).toBe(
      "https://files.example/q3/report.pdf",
    );
  });

  it("does not render file content or an object URL on the server", () => {
    const { document } = renderSSR(FilePreview, {
      id: "x",
      file: new File(["<script>alert(1)</script>"], "page.html", {
        type: "text/html",
      }),
    });

    expect(document.querySelector("pre, script, img, iframe")).toBeNull();
    expect(document.querySelector("[href^='blob:']")).toBeNull();
    expect(
      document.querySelector(".bx--file-preview__meta")?.textContent,
    ).toContain("25 B");
  });

  it("never links a javascript: src", () => {
    const { document } = renderSSR(FilePreview, {
      id: "x",
      src: "javascript:alert(1)",
    });

    expect(document.querySelector("a[href^='javascript']")).toBeNull();
  });
});
