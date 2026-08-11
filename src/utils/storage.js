// =========================================================
// PERSISTENCE (localStorage)
//
// Everything stays on-device: no server, no account, nothing
// transmitted anywhere. localStorage is scoped to this origin,
// so only this app can read it.
// =========================================================

const KEYS = {
  todos: "taskly:todos",
  workspaces: "taskly:workspaces",
  welcomed: "taskly:welcomed",
  notified: "taskly:notified",
};

// reads + parses a key. Never throws: private browsing can block
// storage entirely, and a corrupted value shouldn't crash the app.
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(KEYS[key] || key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// writes a value as JSON. Failures are swallowed — if the device is
// out of storage the app keeps working in memory for that session.
export function save(key, value) {
  try {
    localStorage.setItem(KEYS[key] || key, JSON.stringify(value));
  } catch {
    // nothing to do but keep running
  }
}

export { KEYS };