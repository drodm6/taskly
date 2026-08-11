import { getWorkspaceCompletion } from "../utils/selectors";

// =========================================================
// Sidebar — the ☰ navigation drawer
// =========================================================

export function Sidebar({
  open,
  onClose,
  todos,
  workspaces,
  viewMode,
  activeWorkspaceId,
  projectsExpanded,
  onToggleProjects,
  onOpenDashboard,
  onSelectWorkspace,
  onSelectAll,
  onSelectDone,
  notificationPermission,
  onEnableNotifications,
}) {
  if (!open) return null;

  const isAllActive = viewMode === "tasks" && activeWorkspaceId === "all";

  return (
    <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed left-0 top-0 h-full w-72 max-w-[80vw] bg-[var(--color-surface)] border-r border-[var(--color-border)] p-5 flex flex-col gap-1 overflow-y-auto shadow-[0_0_30px_rgba(0,0,0,0.6)]"
      >
        <button
          onClick={onOpenDashboard}
          className="text-left px-3 py-2.5 rounded-lg text-[15px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-accent-light)] transition-colors"
        >
          📊 Dashboard
        </button>

        <div className="h-px bg-[var(--color-border)] my-2" />

        <button
          onClick={onToggleProjects}
          className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] font-bold text-[var(--color-ink)] hover:bg-[var(--color-accent-light)] transition-colors"
        >
          <span>📁 Projects</span>
          <span className={`text-xs transition-transform ${projectsExpanded ? "rotate-90" : ""}`}>
            ▶
          </span>
        </button>

        {projectsExpanded && (
          <div className="flex flex-col gap-1 pl-2 mb-1">
            {workspaces.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-muted)] px-3 py-1">No projects yet.</p>
            ) : (
              workspaces.map((ws, index) => {
                const pct = getWorkspaceCompletion(todos, ws.id);
                return (
                  <button
                    key={ws.id}
                    onClick={() => onSelectWorkspace(ws.id)}
                    // staggered delay makes projects appear one by one
                    style={{ animationDelay: `${index * 80}ms`, color: ws.color }}
                    className="workspace-fade-in flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--color-accent-light)] transition-colors"
                  >
                    <span className="truncate">
                      {ws.icon} {ws.name}
                    </span>
                    <span className="text-xs text-[var(--color-ink-muted)] shrink-0">
                      {pct === null ? "—" : `${pct}%`}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}

        <div className="h-px bg-[var(--color-border)] my-2" />

        <button
          onClick={onSelectAll}
          className={`text-left px-3 py-2.5 rounded-lg text-[15px] font-semibold hover:bg-[var(--color-accent-light)] transition-colors ${
            isAllActive ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
          }`}
        >
          🗂 All tasks
        </button>

        <button
          onClick={onSelectDone}
          className={`text-left px-3 py-2.5 rounded-lg text-[15px] font-semibold hover:bg-[var(--color-accent-light)] transition-colors ${
            viewMode === "done" ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
          }`}
        >
          ✅ Done
        </button>

        {/* only shown while permission is still askable — once granted
            or denied, the browser won't show the prompt again anyway */}
        {notificationPermission === "default" && (
          <>
            <div className="h-px bg-[var(--color-border)] my-2" />
            <button
              onClick={onEnableNotifications}
              className="text-left px-3 py-2.5 rounded-lg text-[15px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-accent-light)] transition-colors"
            >
              🔔 Enable reminders
            </button>
          </>
        )}

        {notificationPermission === "granted" && (
          <>
            <div className="h-px bg-[var(--color-border)] my-2" />
            <p className="px-3 py-1 text-xs text-[var(--color-ink-muted)] m-0">
              🔔 Reminders on — 1 day and 1 hour before each countdown, while the app is open.
            </p>
          </>
        )}
      </div>
    </div>
  );
}