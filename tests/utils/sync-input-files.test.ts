import { syncInputFiles } from "../../src/utils/sync-input-files.js";

describe("syncInputFiles", () => {
  const fileInput = () => {
    const input = document.createElement("input");
    input.type = "file";
    return input;
  };
  const names = (input: HTMLInputElement) => {
    assert(input.files);
    return Array.from(input.files).map((file) => file.name);
  };

  it("sets the input's files", () => {
    const input = fileInput();

    syncInputFiles(input, [new File(["a"], "a.txt"), new File(["b"], "b.txt")]);

    expect(names(input)).toEqual(["a.txt", "b.txt"]);
  });

  it("clears the input for an empty list", () => {
    const input = fileInput();
    syncInputFiles(input, [new File(["a"], "a.txt")]);

    syncInputFiles(input, []);

    expect(input.files).toHaveLength(0);
  });
});
