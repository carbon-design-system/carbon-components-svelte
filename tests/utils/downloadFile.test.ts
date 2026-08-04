import { downloadFile } from "../../src/utils/downloadFile.js";

describe("downloadFile", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:mock-url");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL;
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("wraps string data in a Blob with the given type", () => {
    downloadFile("id,name\n1,Alpha", "items.csv", "text/csv;charset=utf-8");

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("text/csv;charset=utf-8");
  });

  test("passes a Blob straight through without rewrapping it", () => {
    const blob = new Blob(["custom"], { type: "application/json" });
    downloadFile(blob, "data.json");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
  });

  test("clicks a temporary anchor with the object URL and filename, then revokes it", () => {
    downloadFile("content", "report.txt");

    expect(clickSpy).toHaveBeenCalledTimes(1);
    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("report.txt");
    expect(anchor.href).toBe("blob:mock-url");
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
