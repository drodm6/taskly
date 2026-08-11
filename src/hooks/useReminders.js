import { useEffect, useRef } from "react";
import { load, save } from "../utils/storage";
import { getDueReminders, pruneSent, showNotification } from "../utils/notifications";

// =========================================================
// useReminders
//
// Watches countdown tasks and fires a notification 1 day and
// 1 hour before each one is due. Runs off the same `now` clock
// that drives the countdown badges, so it checks every second
// while the app is open.
//
// Already-sent reminders are recorded in localStorage so one
// never fires twice — including across reloads.
// =========================================================

export function useReminders(todos, now, enabled) {
  // a ref, not state: updating it must not trigger a re-render,
  // or every notification would cause a render loop
  const sentRef = useRef(load("notified", {}));

  useEffect(() => {
    if (!enabled) return;

    const due = getDueReminders(todos, now, sentRef.current);
    if (due.length === 0) return;

    for (const { id, todo, reminder } of due) {
      showNotification(
        `${todo.text} — due in ${reminder.label}`,
        todo.tag ? `#${todo.tag}` : "Taskly reminder"
      );
      sentRef.current[id] = true;
    }

    save("notified", sentRef.current);
  }, [todos, now, enabled]);

  // clear records for deleted tasks so the store doesn't grow forever
  useEffect(() => {
    const pruned = pruneSent(sentRef.current, todos);
    if (Object.keys(pruned).length !== Object.keys(sentRef.current).length) {
      sentRef.current = pruned;
      save("notified", pruned);
    }
  }, [todos]);
}