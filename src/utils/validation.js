import { getTodayString } from "./date";

// =========================================================
// VALIDATION
// One shared rule set instead of the same three checks
// copy-pasted into each form. Returns an error message
// string, or null when the task is valid.
// =========================================================

export function validateTask({ text, date, type, time }) {
  if (text.trim() === "") return "Please write something to do first.";
  if (date && date < getTodayString()) return "The date can't be in the past.";
  if (type === "countdown" && (!date || !time)) {
    return "Countdown tasks need both a date and a time.";
  }
  return null;
}