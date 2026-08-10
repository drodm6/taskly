import { useEffect } from "react";
import { Modal } from "../ui/Modal";
import {
  TextField,
  DateTimeField,
  PrimaryButton,
  OutlineButton,
  SectionLabel,
  SegmentedControl,
} from "../ui";
import { useTaskForm } from "../../hooks/useTaskForm";
import { validateTask } from "../../utils/validation";
import { getTodayString, normalizeTag } from "../../utils/date";
import { TASK_TYPES } from "../../constants";

export function NewTaskModal({ open, onClose, onCreate, activeWorkspaceId }) {
  const { values, set, reset } = useTaskForm();

  // clear the form each time the modal opens
  useEffect(() => {
    if (open) reset();
  }, [open]);

  function handleCreate() {
    const error = validateTask(values);
    if (error) return alert(error);

    onCreate({
      text: values.text.trim(),
      date: values.date,
      tag: normalizeTag(values.tag),
      type: values.type,
      time: values.type === "countdown" ? values.time : "",
      // a task made while viewing a project joins it; from "All" it's general
      workspaceId: activeWorkspaceId === "all" ? null : activeWorkspaceId,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="New task">
      <TextField
        value={values.text}
        onChange={(e) => set("text", e.target.value)}
        placeholder="What needs to get done?"
      />

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

      <SectionLabel>Task type</SectionLabel>
      <SegmentedControl
        options={TASK_TYPES}
        value={values.type}
        onChange={(v) => set("type", v)}
      />

      {values.type === "countdown" && (
        <DateTimeField
          label="Time"
          type="time"
          value={values.time}
          onChange={(e) => set("time", e.target.value)}
          placeholder="Select time"
        />
      )}

      <div className="flex gap-2.5 mt-1.5">
        <PrimaryButton onClick={handleCreate} className="flex-1">
          Create
        </PrimaryButton>
        <OutlineButton onClick={onClose} muted className="flex-1">
          Cancel
        </OutlineButton>
      </div>
    </Modal>
  );
}