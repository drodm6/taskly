import { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import {
  TextField,
  EmojiField,
  DateTimeField,
  PrimaryButton,
  OutlineButton,
  SectionLabel,
  SegmentedControl,
  ColorSwatchRow,
  GhostToggle,
} from "../ui";
import { useTaskForm } from "../../hooks/useTaskForm";
import { validateTask } from "../../utils/validation";
import { getTodayString, normalizeTag } from "../../utils/date";
import { WORKSPACE_COLORS, TASK_TYPES } from "../../constants";

const EMPTY_DRAFT = {
  name: "",
  icon: "",
  color: WORKSPACE_COLORS[0].value,
  hidden: false,
};

export function ProjectModal({
  open,
  onClose,
  todos,
  onCreateWorkspace,
  onUpdateWorkspace,
  onAddTodo,
  onFinish,
}) {
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  // becomes a real id once the workspace is actually created
  const [workspaceId, setWorkspaceId] = useState(null);
  const { values, set, reset } = useTaskForm();

  useEffect(() => {
    if (open) {
      setDraft(EMPTY_DRAFT);
      setWorkspaceId(null);
      reset();
    }
  }, [open]);

  // updates the draft AND the real workspace if one already exists —
  // otherwise icon/color/hidden changes made after the first task
  // would silently update a value nothing reads anymore
  function patchMeta(updates) {
    setDraft((prev) => ({ ...prev, ...updates }));
    if (workspaceId !== null) onUpdateWorkspace(workspaceId, updates);
  }

  function handleAddTask() {
    if (draft.name.trim() === "") return alert("Please name your workspace first.");

    const error = validateTask(values);
    if (error) return alert(error);

    // workspace is created on the first add; later adds reuse the id
    let id = workspaceId;
    if (id === null) {
      id = onCreateWorkspace({ ...draft, name: draft.name.trim(), icon: draft.icon.trim() });
      setWorkspaceId(id);
    }

    onAddTodo({
      text: values.text.trim(),
      date: values.date,
      tag: normalizeTag(values.tag),
      type: values.type,
      time: values.type === "countdown" ? values.time : "",
      workspaceId: id,
    });

    reset(); // modal stays open so more tasks can be added
  }

  // creates the workspace even if no tasks were added, then jumps to it
  function handleDone() {
    let id = workspaceId;
    if (id === null && draft.name.trim() !== "") {
      id = onCreateWorkspace({ ...draft, name: draft.name.trim(), icon: draft.icon.trim() });
    }
    onFinish(id);
    onClose();
  }

  const addedTasks = todos.filter((t) => t.workspaceId === workspaceId);

  return (
    // same maxWidth as NewTaskModal so the input boxes are identical
    <Modal open={open} onClose={onClose} title="New workspace" maxWidth="max-w-[380px]">
      <SectionLabel>Workspace details</SectionLabel>

      <div className="flex items-center gap-2.5">
        <TextField
          value={draft.name}
          onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
          placeholder="Name (e.g. Company)"
          disabled={workspaceId !== null}
          className="flex-1 min-w-0"
        />
        <GhostToggle active={draft.hidden} onClick={() => patchMeta({ hidden: !draft.hidden })} />
      </div>
      <p className="text-xs text-[var(--color-ink-muted)] m-0">
        {draft.hidden
          ? "Hidden — only visible via the 👻 Hidden tab."
          : "Visible in the tab row and in All."}
      </p>

      <div className="flex items-center gap-2.5">
        <EmojiField
          value={draft.icon}
          onChange={(icon) => patchMeta({ icon })}
          className="w-20"
        />
        <ColorSwatchRow
          selectedColor={draft.color}
          onSelect={(color) => patchMeta({ color })}
        />
      </div>
      <p className="text-xs text-[var(--color-ink-muted)] m-0">
        Optional emoji icon and a color to tint this project's name everywhere it appears.
      </p>

      <div className="h-px bg-[var(--color-border)] my-1" />

      <SectionLabel>Add a task to this workspace</SectionLabel>

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

      <OutlineButton onClick={handleAddTask}>+ Add task</OutlineButton>

      {workspaceId !== null && addedTasks.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <SectionLabel>Added ({addedTasks.length})</SectionLabel>
          {addedTasks.map((t) => (
            <p key={t.id} className="text-sm text-[var(--color-ink)] m-0">
              • {t.text}
            </p>
          ))}
        </div>
      )}

      <PrimaryButton onClick={handleDone} className="mt-1">
        Done
      </PrimaryButton>
    </Modal>
  );
}