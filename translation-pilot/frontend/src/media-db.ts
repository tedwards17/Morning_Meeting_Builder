import { openDB } from "idb";

// Round 3's initial browser build could leave a version-1 legacy database
// without stores after checking for a Round 2 state. Version 2 repairs that
// database and preserves any existing media and state records.
let connection: ReturnType<typeof openDB> | undefined;
export function openMediaDatabase() {
  if (!connection) {
    connection = openDB("dtb-morning-meeting", 2, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("state")) database.createObjectStore("state");
        if (!database.objectStoreNames.contains("assets")) database.createObjectStore("assets");
      },
    }).catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}
