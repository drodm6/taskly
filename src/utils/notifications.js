import { combineDateAndTime } from "./date";

// =========================================================
// NOTIFICATIONS
//
// IMPORTANT LIMITATION: these only fire while the app is open
// (foreground or a background tab). Waking a fully closed web
// app on a schedule requires a push server, which this app
// deliberately doesn't have. On launch we also catch up on any
// reminder whose window was crossed while the app was closed.
// =========================================================

export const REMINDERS = [
  { key: "1d", label: "1 day", ms: 24 * 60 * 60 * 1000 },
  { key: "1h", label: "1 hour", ms: 60 * 60 * 1000 },
];

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getPermission() {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

// Must be called from a user gesture (a click) — browsers reject
// permission requests that aren't tied to a real interaction.
export async function requestPermission() {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function showNotification(title, body) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/icon-192.png", badge: "/icon-192.png" });
  } catch {
    // some browsers block constructing Notification directly
  }
}

// Finds reminders that are due right now and haven't been sent yet.
// `sent` is a map of "todoId:reminderKey" -> true, persisted so a
// reminder never fires twice across reloads.
export function getDueReminders(todos, now, sent) {
  const due = [];

  for (const todo of todos) {
    if (todo.type !== "countdown" || todo.completed || !todo.date || !todo.time) continue;

    const target = combineDateAndTime(todo.date, todo.time);
    if (!target) continue;

    const msLeft = target.getTime() - now.getTime();
    if (msLeft <= 0) continue; // already passed — no reminder

    for (const reminder of REMINDERS) {
      const id = `${todo.id}:${reminder.key}`;
      // fire once the remaining time has dropped below the threshold
      if (msLeft <= reminder.ms && !sent[id]) {
        due.push({ id, todo, reminder });
      }
    }
  }

  return due;
}

// drops entries for tasks that no longer exist, so the record of
// already-sent reminders doesn't grow forever
export function pruneSent(sent, todos) {
  const liveIds = new Set(todos.map((t) => String(t.id)));
  const next = {};
  for (const key of Object.keys(sent)) {
    if (liveIds.has(key.split(":")[0])) next[key] = sent[key];
  }
  return next;
}