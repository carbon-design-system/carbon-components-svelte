// https://github.com/lagden/svelte-editor-quill

import Quill from "quill";

export function quill(node, params) {
  const quill = new Quill(node, {
    ...params.options,
  });

  if (params.html) {
    const delta = quill.clipboard.convert(params.html);
    quill.setContents(delta, "silent");
  }

  const onTextChange = () => {
    const customEvent = new CustomEvent("text-change", {
      detail: {
        html: quill.root.innerHTML,
        text: quill.getText(),
      },
    });
    node.dispatchEvent(customEvent);
  };

  quill.on("text-change", onTextChange);

  return {
    destroy() {
      quill.off("text-change", onTextChange);
    },
  };
}
