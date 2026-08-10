import { useEffect } from "react";
import { Modal } from "../ui/Modal";
import { TextField, DateTimeField, PrimaryButton, OutlineButton } from "../ui";
import { useTaskForm } from "../../hooks/useTaskForm";
import { getTodayString, normalizeTag } from "../../utils/date";

export function EditTaskModal({ todo, onClose, onApply }) {
  const { values, set, reset } = useTaskForm();

  // refill the form whenever a different task is opened
  useEffect(() => {
    if (todo) reset({ text: todo.text, date: todo.date, tag: todo.tag });
  }, [todo]);

  function handleApply() {
    if (values.text.trim() === "") return alert("Todo text can't be empty.");
    if (values.date && values.date < getTodayString()) {
      return alert("The date can't be in the past.");
    }

    onApply(todo.id, {
      text: values.text.trim(),
      date: values.date,
      tag: normalizeTag(values.tag),
    });
    onClose();
  }

  return (
    // z-50: can be opened from inside the settings modal, so it must
    // layer above it rather than behind
    <Modal
      open={todo !== null}
      onClose={onClose}
      title="Edit todo"
      maxWidth="max-w-[360px]"
      zIndex="z-50"
    >
      <TextField value={values.text} onChange={(e) => set("text", e.target.value)} />

      <DateTimeField
        label="Date"
        type="date"
        value={values.date}
        min={getTodayString()}
        onChange={(e) => set("date", e.target.value)}
        placeholder="Select date"
      />

      <TextField
        value={values.tag}
        onChange={(e) => set("tag", e.target.value)}
        placeholder="#tag (optional)"
      />

      <div className="flex gap-2.5 mt-1.5">
        <PrimaryButton onClick={handleApply} className="flex-1">
          Apply
        </PrimaryButton>
        <OutlineButton onClick={onClose} muted className="flex-1">
          Cancel
        </OutlineButton>
      </div>
    </Modal>
  );
}