import { formatDate, formatRemaining, combineDateAndTime } from "../utils/date";

// =========================================================
// TaskItem — one task row
//
// The project color tints ONLY the project badge; the card
// border, complete circle, and countdown text stay orange so
// a mixed list doesn't turn into a rainbow.
// =========================================================

export function TaskItem({ todo, workspace, showWorkspaceBadge, now, onToggle, onEdit, onDelete }) {
  const isCountdown = todo.type === "countdown" && todo.date && todo.time;
  const target = isCountdown ? combineDateAndTime(todo.date, todo.time) : null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border ${
        isCountdown
          ? "bg-[var(--color-accent-light)] border-[var(--color-accent)] border-dashed"
          : "bg-[var(--color-canvas)] border-[var(--color-border)] border-l-4 border-l-[var(--color-accent)]"
      }`}
    >
      <button
        onClick={() => onToggle(todo.id)}
        aria-label="Mark task as complete"
        className={`mt-0.5 w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center text-[11px] transition-colors ${
          todo.completed
            ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-black"
            : "border-[var(--color-ink-muted)] text-transparent"
        }`}
      >
        ✓
      </button>

      <p
        className={`flex-1 min-w-0 m-0 text-[15px] leading-snug break-words ${
          todo.completed
            ? "line-through text-[var(--color-ink-muted)]"
            : "text-[var(--color-ink)]"
        }`}
      >
        {isCountdown && (
          <span className="block text-[11px] uppercase tracking-wide text-[var(--color-accent)] mb-0.5">
            ⏱ Countdown
          </span>
        )}

        {todo.text}

        {/* date + tag + badge share one wrapping row */}
        {(todo.date || todo.tag || showWorkspaceBadge) && (
          <span className="flex flex-wrap items-center gap-2 mt-1">
            {todo.date && (
              <span className="text-xs text-[var(--color-ink-muted)]">
                {formatDate(todo.date)}
                {todo.time ? ` · ${todo.time}` : ""}
              </span>
            )}

            {todo.tag && (
              <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                #{todo.tag}
              </span>
            )}

            {showWorkspaceBadge && workspace && (
              <span
                style={{ borderColor: workspace.color, color: workspace.color }}
                className="inline-block text-xs px-2 py-0.5 rounded-full border"
              >
                {workspace.icon} {workspace.name}
              </span>
            )}
          </span>
        )}

        {isCountdown && (
          <span className="block text-xs font-semibold text-[var(--color-accent)] mt-1">
            {formatRemaining(target, now)}
          </span>
        )}
      </p>

      <div className="flex gap-1.5 shrink-0">
        <button
          onClick={() => onEdit(todo)}
          className="px-3.5 py-2 text-[13px] font-semibold rounded-md bg-transparent border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="px-3.5 py-2 text-[13px] font-semibold rounded-md bg-transparent border border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}