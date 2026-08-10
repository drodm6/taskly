import { Modal } from "../ui/Modal";
import { ColorSwatchRow, GhostToggle, EmojiField } from "../ui";

export function SettingsModal({
  open,
  onClose,
  todos,
  workspaces,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onEditTask,
  onDeleteTask,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Manage workspaces"
      maxWidth="max-w-[440px]"
      showCloseButton
    >
      {workspaces.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          No workspaces yet — create one with the "+ Project" button.
        </p>
      ) : (
        workspaces.map((ws) => {
          const wsTasks = todos.filter((t) => t.workspaceId === ws.id);
          return (
            <div
              key={ws.id}
              className="border border-[var(--color-border)] rounded-lg p-3.5 flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2">
                <EmojiField
                  value={ws.icon}
                  onChange={(icon) => onUpdateWorkspace(ws.id, { icon })}
                  className="w-14 !h-9 !text-sm"
                />
                <input
                  type="text"
                  value={ws.name}
                  onChange={(e) => onUpdateWorkspace(ws.id, { name: e.target.value })}
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-[16px] font-semibold rounded-md bg-transparent border border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <GhostToggle
                  active={ws.hidden}
                  onClick={() => onUpdateWorkspace(ws.id, { hidden: !ws.hidden })}
                  size="w-8 h-8"
                />
                <button
                  onClick={() => onDeleteWorkspace(ws.id)}
                  className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>

              <ColorSwatchRow
                selectedColor={ws.color}
                onSelect={(color) => onUpdateWorkspace(ws.id, { color })}
              />

              {wsTasks.length === 0 ? (
                <p className="text-xs text-[var(--color-ink-muted)] m-0">
                  No tasks in this workspace.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {wsTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-2 text-sm text-[var(--color-ink)]"
                    >
                      <span
                        className={`truncate ${
                          t.completed ? "line-through text-[var(--color-ink-muted)]" : ""
                        }`}
                      >
                        {t.text}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => onEditTask(t)}
                          className="px-2 py-1 text-xs font-semibold rounded border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteTask(t.id)}
                          className="px-2 py-1 text-xs font-semibold rounded border border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-red-500 hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </Modal>
  );
}