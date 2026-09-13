const queryStore = writable(""); // flag
const matchStore = readable(null); // flag
const filterStore = derived(query, ($query) => $query); // flag
let registryStore = null; // flag

const query = writable("");
const match = readable(null);
let registry = null;
const hasPrimaryItems = writable(false);
