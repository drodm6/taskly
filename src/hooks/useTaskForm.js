import { useState } from "react";

// =========================================================
// useTaskForm — one shared form shape
//
// Replaces the three duplicated sets of form state
// (newText/newDate/..., pText/pDate/..., editText/editDate/...)
// that all held identical fields.
// =========================================================

const EMPTY = { text: "", date: "", tag: "", type: "standard", time: "" };

export function useTaskForm() {
  const [values, setValues] = useState(EMPTY);

  // updates one field: set("text", "buy milk")
  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  // clears the form, or fills it with an existing task's values
  function reset(next = {}) {
    setValues({ ...EMPTY, ...next });
  }

  return { values, set, reset };
}