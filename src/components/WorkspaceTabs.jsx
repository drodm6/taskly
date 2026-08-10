// =========================================================
// WorkspaceTabs — the horizontally scrollable tab row,
// plus the 👻 Hidden toggle and ⚙ settings button.
// =========================================================

export function WorkspaceTabs({
  workspaces,
  hiddenWorkspaces,
  viewMode,
  activeWorkspaceId,
  showHiddenPicker,
  onSelectAll,
  onSelectWorkspace,
  onToggleHiddenPicker,
  onOpenSettings,
}) {
  const isAllActive = viewMode === "tasks" && activeWorkspaceId === "all";

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 mb-1 [scrollbar-width:none]">
        <button
          onClick={onSelectAll}
          className={`shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border transition-colors ${
            isAllActive
              ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-black"
              : "bg-transparent border-[var(--color-border)] text-[var(--color-ink-muted)]"
          }`}
        >
          All
        </button>

        {workspaces.map((ws) => {
          const isActive = viewMode === "tasks" && activeWorkspaceId === ws.id;
          return (
            <button
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              style={
                isActive
                  ? { backgroundColor: ws.color, borderColor: ws.color }
                  : { borderColor: ws.color, color: ws.color }
              }
              className={`shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border transition-colors ${
                isActive ? "text-black" : "bg-transparent"
              }`}
            >
              {ws.icon} {ws.name}
            </button>
          );
        })}

        <button
          onClick={onToggleHiddenPicker}
          className="shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors ml-auto"
        >
          👻 Hidden
        </button>

        <button
          onClick={onOpenSettings}
          aria-label="Manage workspaces"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
        >
          ⚙
        </button>
      </div>

      {showHiddenPicker && (
        <div className="flex flex-wrap gap-2 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg p-3 mb-4">
          {hiddenWorkspaces.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-muted)] m-0">No hidden workspaces.</p>
          ) : (
            hiddenWorkspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => onSelectWorkspace(ws.id)}
                style={{ borderColor: ws.color, color: ws.color }}
                className="px-3.5 py-1.5 text-[13px] font-semibold rounded-full border hover:bg-[var(--color-accent-light)] transition-colors"
              >
                👻 {ws.icon} {ws.name}
              </button>
            ))
          )}
        </div>
      )}
    </>
  );
}