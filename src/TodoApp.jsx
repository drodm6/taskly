import { useState } from "react";
import { useTaskly } from "./hooks/useTaskly";
import { useNow } from "./hooks/useNow";
import { useReminders } from "./hooks/useReminders";
import { getVisibleTodos } from "./utils/selectors";
import { load, save } from "./utils/storage";
import { getPermission, requestPermission } from "./utils/notifications";
import { TaskItem } from "./components/TaskItem";
import { WorkspaceTabs } from "./components/WorkspaceTabs";
import { Sidebar } from "./components/Sidebar";
import { PrimaryButton, OutlineButton } from "./components/ui";
import { NewTaskModal } from "./components/modals/NewTaskModal";
import { ProjectModal } from "./components/modals/ProjectModal";
import { EditTaskModal } from "./components/modals/EditTaskModal";
import { DashboardModal } from "./components/modals/DashboardModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { WelcomeModal } from "./components/modals/WelcomeModal";

// =========================================================
// TodoApp
//
// Owns only UI/navigation state. Data lives in useTaskly,
// filtering lives in selectors, and each modal owns its own
// form — so this file is composition and layout only.
// =========================================================

export default function TodoApp() {
  const {
    todos,
    workspaces,
    addTodo,
    deleteTodo,
    toggleComplete,
    updateTodo,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspace,
  } = useTaskly();

  const now = useNow();

  // ---- welcome screen (shown once, tracked in localStorage) ----
  const [showWelcome, setShowWelcome] = useState(() => !load("welcomed", false));

  // ---- notification permission ----
  const [permission, setPermission] = useState(() => getPermission());

  // fires 1-day and 1-hour reminders for countdown tasks while the app
  // is open. Background delivery would need a push server, which this
  // app deliberately doesn't have.
  useReminders(todos, now, permission === "granted");

  async function handleEnableNotifications() {
    const result = await requestPermission();
    setPermission(result);
  }

  function dismissWelcome() {
    save("welcomed", true);
    setShowWelcome(false);
  }

  // ---- navigation ----
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("all");
  const [viewMode, setViewMode] = useState("tasks"); // "tasks" | "done"
  const [searchQuery, setSearchQuery] = useState("");
  const [showHiddenPicker, setShowHiddenPicker] = useState(false);

  // ---- modal visibility ----
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  const visibleTodos = getVisibleTodos({
    todos,
    workspaces,
    viewMode,
    activeWorkspaceId,
    searchQuery,
  });

  const visibleWorkspaces = workspaces.filter((w) => !w.hidden);
  const hiddenWorkspaces = workspaces.filter((w) => w.hidden);

  // ---- navigation helpers ----
  function goToWorkspace(id) {
    setViewMode("tasks");
    setActiveWorkspaceId(id);
    setShowHiddenPicker(false);
    setSidebarOpen(false);
  }

  function goToAllTasks() {
    goToWorkspace("all");
  }

  function goToDone() {
    setViewMode("done");
    setSidebarOpen(false);
  }

  const viewTitle =
    viewMode === "done"
      ? "Done"
      : activeWorkspaceId === "all"
      ? "All tasks"
      : getWorkspace(activeWorkspaceId)?.name || "Tasks";

  return (
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">
      {/* ---------- header ---------- */}
      <div className="flex items-center gap-3 px-4 sm:px-8 py-4 border-b border-[var(--color-border)]">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-accent)] text-black text-xl font-bold hover:brightness-110 transition-all"
        >
          ☰
        </button>
        <h1 className="font-[var(--font-display)] text-xl sm:text-2xl font-semibold uppercase tracking-wide m-0">
          Taskly
        </h1>
      </div>

      {/* ---------- main content ---------- */}
      <div className="max-w-[700px] mx-auto px-4 sm:px-8 py-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by text or #tag..."
          className="w-full h-11 px-3 text-[16px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors mb-3"
        />

        <div className="flex gap-2.5 mb-4">
          <PrimaryButton
            onClick={() => {
              setViewMode("tasks");
              setNewTaskOpen(true);
            }}
            className="flex-1"
          >
            + New Task
          </PrimaryButton>
          <OutlineButton
            onClick={() => {
              setViewMode("tasks");
              setProjectOpen(true);
            }}
            className="flex-1"
          >
            + Project
          </OutlineButton>
        </div>

        <WorkspaceTabs
          workspaces={visibleWorkspaces}
          hiddenWorkspaces={hiddenWorkspaces}
          viewMode={viewMode}
          activeWorkspaceId={activeWorkspaceId}
          showHiddenPicker={showHiddenPicker}
          onSelectAll={goToAllTasks}
          onSelectWorkspace={goToWorkspace}
          onToggleHiddenPicker={() => setShowHiddenPicker((v) => !v)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)] mb-2 mt-1">
          {viewTitle}
        </p>

        <div className="flex flex-col gap-2.5">
          {visibleTodos.length === 0 ? (
            <p className="text-center text-[var(--color-ink-muted)] text-sm py-2.5">
              {searchQuery
                ? "No todos match your search."
                : viewMode === "done"
                ? "No completed tasks yet."
                : "No tasks here yet."}
            </p>
          ) : (
            visibleTodos.map((todo) => (
              <TaskItem
                key={todo.id}
                todo={todo}
                workspace={todo.workspaceId ? getWorkspace(todo.workspaceId) : null}
                showWorkspaceBadge={
                  (activeWorkspaceId === "all" || viewMode === "done") && !!todo.workspaceId
                }
                now={now}
                onToggle={toggleComplete}
                onEdit={setEditingTodo}
                onDelete={deleteTodo}
              />
            ))
          )}
        </div>
      </div>

      {/* ---------- sidebar + modals ---------- */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        todos={todos}
        workspaces={visibleWorkspaces}
        viewMode={viewMode}
        activeWorkspaceId={activeWorkspaceId}
        projectsExpanded={projectsExpanded}
        onToggleProjects={() => setProjectsExpanded((v) => !v)}
        onOpenDashboard={() => {
          setSidebarOpen(false);
          setDashboardOpen(true);
        }}
        onSelectWorkspace={goToWorkspace}
        onSelectAll={goToAllTasks}
        onSelectDone={goToDone}
        notificationPermission={permission}
        onEnableNotifications={handleEnableNotifications}
      />

      <DashboardModal
        open={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        todos={todos}
        workspaces={workspaces}
        now={now}
      />

      <NewTaskModal
        open={newTaskOpen}
        onClose={() => setNewTaskOpen(false)}
        onCreate={addTodo}
        activeWorkspaceId={activeWorkspaceId}
      />

      <ProjectModal
        open={projectOpen}
        onClose={() => setProjectOpen(false)}
        todos={todos}
        onCreateWorkspace={createWorkspace}
        onUpdateWorkspace={updateWorkspace}
        onAddTodo={addTodo}
        onFinish={(id) => {
          if (id !== null) goToWorkspace(id);
        }}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        todos={todos}
        workspaces={workspaces}
        onUpdateWorkspace={updateWorkspace}
        onDeleteWorkspace={(id) =>
          deleteWorkspace(id, () => {
            if (activeWorkspaceId === id) goToAllTasks();
          })
        }
        onEditTask={setEditingTodo}
        onDeleteTask={deleteTodo}
      />

      {/* rendered last + z-50 so it layers above the settings modal */}
      <EditTaskModal
        todo={editingTodo}
        onClose={() => setEditingTodo(null)}
        onApply={updateTodo}
      />

      {/* z-60 — sits above everything on first launch */}
      <WelcomeModal
        open={showWelcome}
        onDismiss={dismissWelcome}
        onEnableNotifications={handleEnableNotifications}
        canAskNotifications={permission === "default"}
      />
    </div>
  );
}