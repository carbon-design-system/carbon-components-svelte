<script>
  import {
    createMemoryFileSystem,
    FileManager,
  } from "carbon-components-svelte";

  const adapter = createMemoryFileSystem({
    entries: [
      { path: "/Documentos/notas.txt", size: 800, type: "text/plain" },
      { path: "/Fotos", kind: "folder" },
      { path: "/leeme.md", size: 120, type: "text/markdown" },
    ],
  });

  // Pass only the strings that change. Each one that builds a sentence
  // from values is a function.
  const texts = {
    rootLabel: "Mis archivos",
    treeLabel: "Carpetas",
    newFolder: "Nueva carpeta",
    untitledFolder: "Carpeta sin título",
    upload: "Subir archivos",
    uploadFolder: "Subir carpeta",
    viewList: "Vista de lista",
    viewGrid: "Vista de cuadrícula",
    details: "Detalles",
    moveTo: "Mover a…",
    delete: "Eliminar",
    columnName: "Nombre",
    columnSize: "Tamaño",
    columnModified: "Modificado",
    columnOwner: "Propietario",
    selected: (count) => `${count} seleccionados`,
    emptyTitle: "Esta carpeta está vacía",
  };
</script>

<FileManager {adapter} {texts} locale="es" height="18rem" />
