import { useState, useEffect } from "react";

// =========================================================
// STATIC DATA (lives outside the component — never changes,
// doesn't depend on props or state)
// =========================================================

// preset color palette for workspaces. A fixed palette (rather than a
// free-form color picker) keeps every project looking intentional and
// guarantees good contrast with the black background + white text.
const WORKSPACE_COLORS = [
  { name: "Orange", value: "#f97316" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Red", value: "#ef4444" },
  { name: "Yellow", value: "#eab308" },
  { name: "Teal", value: "#14b8a6" },
];

// =========================================================
// SMALL PRESENTATIONAL HELPERS
// (plain functions returning JSX — not connected to state,
// just used to avoid repeating the same markup twice)
// =========================================================

// one number + label tile, used in the Dashboard modal
function StatCard({ label, value }) {
  return (
    <div className="border border-[var(--color-border)] rounded-lg p-3.5 flex flex-col items-center justify-center gap-1 text-center">
      <span className="text-2xl font-bold text-[var(--color-accent)]">{value}</span>
      <span className="text-xs text-[var(--color-ink-muted)]">{label}</span>
    </div>
  );
}

// row of clickable color circles, used in both the "+ Project" modal
// and the settings modal's per-workspace editor
function ColorSwatchRow({ selectedColor, onSelect }) {
  return (
    <div className="flex-1 flex flex-wrap gap-2">
      {WORKSPACE_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onSelect(c.value)}
          title={c.name}
          style={{ backgroundColor: c.value }}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${
            selectedColor === c.value ? "border-white scale-110" : "border-transparent"
          }`}
        />
      ))}
    </div>
  );
}

// a date or time input with its own always-visible label above it,
// plus a custom placeholder shown while it's empty — but ONLY on
// small (mobile) screens.
//
// FIX: mobile browsers often draw nothing inside an empty date/time
// input — no "dd/mm/yyyy" dashes, nothing — so our own placeholder
// fills that gap there. Desktop/laptop browsers do the opposite:
// Chrome, Firefox, etc. already render their own native placeholder
// ("dd/mm/yyyy", "--:--") for an empty date/time input. Showing ours
// on top of that native one was the "messy" double-placeholder look.
// The `sm:hidden` class below is the fix: our placeholder shows by
// default (mobile widths), then disappears entirely at the `sm`
// breakpoint (640px) and up, letting the browser's own native
// placeholder show through unobstructed on larger screens. This is a
// pure CSS breakpoint, not real device detection — but screen width
// is the right signal here, since it's screen space (not device
// type) that decides whether there's room for the browser's own
// placeholder to render legibly.
function LabeledDateTimeField({ label, type, value, onChange, min, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          min={min}
          onChange={onChange}
          className="w-full px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
        />

        {!value && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-[var(--color-ink-muted)] pointer-events-none sm:hidden">
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

// =========================================================
// TodoApp
// =========================================================
export default function TodoApp() {
  // =======================================================
  // STATE
  // =======================================================

  // each todo is an object:
  // { id, text, date, tag, completed, type, time, workspaceId }
  const [todos, setTodos] = useState([]);

  // each workspace ("project") is an object:
  // { id, name, icon, color, hidden }
  const [workspaces, setWorkspaces] = useState([]);

  // which workspace tab is selected: "all" or a workspace id
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("all");

  // "tasks" = normal view, filtered by activeWorkspaceId above
  // "done"  = a dedicated view showing every completed task across
  //           every non-hidden workspace, ignoring activeWorkspaceId
  const [viewMode, setViewMode] = useState("tasks");

  const [showHiddenPicker, setShowHiddenPicker] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // ---- sidebar navigation (☰ menu) ----
  const [showSidebar, setShowSidebar] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const [showDashboardModal, setShowDashboardModal] = useState(false);

  // a ticking clock — updates every second so countdown badges and
  // the "active countdowns" dashboard stat stay live
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  // ---- "+ New Task" modal (home-screen quick add) ----
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newType, setNewType] = useState("standard");
  const [newTime, setNewTime] = useState("");

  // ---- "+ Project" modal (create a workspace + tasks inside it) ----
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [draftWorkspaceName, setDraftWorkspaceName] = useState("");
  const [draftWorkspaceIcon, setDraftWorkspaceIcon] = useState("");
  const [draftWorkspaceColor, setDraftWorkspaceColor] = useState(WORKSPACE_COLORS[0].value);
  const [draftWorkspaceHidden, setDraftWorkspaceHidden] = useState(false);
  // becomes a real id the moment the workspace is first actually created
  const [draftWorkspaceId, setDraftWorkspaceId] = useState(null);
  // task fields for adding tasks *inside* the project modal
  const [pText, setPText] = useState("");
  const [pDate, setPDate] = useState("");
  const [pTag, setPTag] = useState("");
  const [pType, setPType] = useState("standard");
  const [pTime, setPTime] = useState("");

  // ---- edit modal (shared by the home list and the settings modal) ----
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTag, setEditTag] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  // =======================================================
  // HELPERS
  // =======================================================

  function formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  function normalizeTag(rawTag) {
    return rawTag.trim().replace(/^#/, "");
  }

  function getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  function combineDateAndTime(dateStr, timeStr) {
    if (!dateStr) return null;
    return new Date(`${dateStr}T${timeStr || "00:00"}`);
  }

  function formatRemaining(targetDate) {
    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Time's up";

    const totalMinutes = Math.floor(diffMs / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    if (totalDays >= 365) {
      const years = Math.floor(totalDays / 365);
      const months = Math.floor((totalDays % 365) / 30);
      return `${years}y ${months}mo left`;
    }
    if (totalDays >= 1) {
      const hours = totalHours % 24;
      const minutes = totalMinutes % 60;
      return `${totalDays}d ${hours}h ${minutes}min left`;
    }
    if (totalHours >= 1) {
      const minutes = totalMinutes % 60;
      return `${totalHours}h ${minutes}min left`;
    }
    return `${totalMinutes}min left`;
  }

  // looks up a full workspace object by id (name / icon / color / hidden)
  function getWorkspace(workspaceId) {
    return workspaces.find((w) => w.id === workspaceId) || null;
  }

  // ids of every workspace currently marked hidden — used to exclude
  // their tasks from "All" and from the Dashboard/Done views
  function getHiddenWorkspaceIds() {
    return workspaces.filter((w) => w.hidden).map((w) => w.id);
  }

  // completion percentage for one workspace's tasks (null if it has none)
  function getWorkspaceCompletion(workspaceId) {
    const wsTasks = todos.filter((t) => t.workspaceId === workspaceId);
    if (wsTasks.length === 0) return null;
    const doneCount = wsTasks.filter((t) => t.completed).length;
    return Math.round((doneCount / wsTasks.length) * 100);
  }

  // =======================================================
  // CORE TODO OPERATIONS (add / delete / complete)
  // =======================================================

  function addTodo(todo) {
    setTodos((prevTodos) => [...prevTodos, todo]);
  }

  function deleteTodo(id) {
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (!confirmed) return;
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
  }

  function toggleComplete(id) {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  // =======================================================
  // WORKSPACE OPERATIONS
  // =======================================================

  function renameWorkspace(id, newName) {
    setWorkspaces((prev) => prev.map((ws) => (ws.id === id ? { ...ws, name: newName } : ws)));
  }

  function setWorkspaceIcon(id, newIcon) {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, icon: newIcon.slice(0, 6) } : ws))
    );
  }

  function setWorkspaceColor(id, newColor) {
    setWorkspaces((prev) => prev.map((ws) => (ws.id === id ? { ...ws, color: newColor } : ws)));
  }

  function toggleWorkspaceHidden(id) {
    setWorkspaces((prev) => prev.map((ws) => (ws.id === id ? { ...ws, hidden: !ws.hidden } : ws)));
  }

  function deleteWorkspace(id) {
    const confirmed = window.confirm(
      "Delete this workspace? All tasks inside it will be deleted too."
    );
    if (!confirmed) return;

    setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
    setTodos((prev) => prev.filter((todo) => todo.workspaceId !== id));

    if (activeWorkspaceId === id) setActiveWorkspaceId("all");
  }

  // =======================================================
  // SORTING — nearest date first
  // =======================================================

  function getSortTimestamp(todo) {
    if (!todo.date) return Infinity;
    const target = combineDateAndTime(todo.date, todo.time);
    return target ? target.getTime() : Infinity;
  }

  function sortByNearestDate(todoList) {
    return [...todoList].sort((a, b) => getSortTimestamp(a) - getSortTimestamp(b));
  }

  // =======================================================
  // SEARCH / FILTER / ACTIVE VIEW
  // =======================================================

  // the single function deciding what the home screen shows: applies
  // the view mode (tasks vs. done) and workspace filter first, then
  // search on top, then sorts — in that order
  function getVisibleTodos() {
    let result = todos;
    const hiddenIds = getHiddenWorkspaceIds();

    if (viewMode === "done") {
      // Done view ignores whichever tab is selected — it always shows
      // every completed task, from every non-hidden workspace or with
      // no workspace at all
      result = result.filter((todo) => todo.completed && !hiddenIds.includes(todo.workspaceId));
    } else if (activeWorkspaceId === "all") {
      result = result.filter((todo) => !hiddenIds.includes(todo.workspaceId));
    } else {
      result = result.filter((todo) => todo.workspaceId === activeWorkspaceId);
    }

    if (searchQuery !== "") {
      const query = normalizeTag(searchQuery).toLowerCase();
      result = result.filter((todo) => {
        const textMatch = todo.text.toLowerCase().includes(query);
        const tagMatch = todo.tag.toLowerCase().includes(query);
        return textMatch || tagMatch;
      });
    }

    return sortByNearestDate(result);
  }

  // =======================================================
  // SIDEBAR NAVIGATION (☰ menu)
  // =======================================================

  function closeSidebar() {
    setShowSidebar(false);
  }

  function goToWorkspace(workspaceId) {
    setViewMode("tasks");
    setActiveWorkspaceId(workspaceId);
    setShowHiddenPicker(false);
    closeSidebar();
  }

  function goToAllTasks() {
    setViewMode("tasks");
    setActiveWorkspaceId("all");
    setShowHiddenPicker(false);
    closeSidebar();
  }

  function goToDone() {
    setViewMode("done");
    closeSidebar();
  }

  function openDashboard() {
    setShowDashboardModal(true);
    closeSidebar();
  }

  // =======================================================
  // "+ NEW TASK" MODAL (home-screen quick add)
  // =======================================================

  function openAddModal() {
    setViewMode("tasks"); // adding a task always returns you to the normal task view
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    setNewText("");
    setNewDate("");
    setNewTag("");
    setNewType("standard");
    setNewTime("");
  }

  function handleCreateTask() {
    const text = newText.trim();

    if (text === "") {
      alert("Please write something to do first.");
      return;
    }
    if (newDate && newDate < getTodayString()) {
      alert("The date can't be in the past.");
      return;
    }
    if (newType === "countdown" && (!newDate || !newTime)) {
      alert("Countdown tasks need both a date and a time.");
      return;
    }

    addTodo({
      id: Date.now(),
      text,
      date: newDate,
      tag: normalizeTag(newTag),
      completed: false,
      type: newType,
      time: newType === "countdown" ? newTime : "",
      workspaceId: activeWorkspaceId === "all" ? null : activeWorkspaceId,
    });

    closeAddModal();
  }

  // =======================================================
  // "+ PROJECT" MODAL (create a workspace + tasks inside it)
  // =======================================================

  function openProjectModal() {
    setViewMode("tasks");
    setShowProjectModal(true);
  }

  function closeProjectModal() {
    setShowProjectModal(false);
    setDraftWorkspaceName("");
    setDraftWorkspaceIcon("");
    setDraftWorkspaceColor(WORKSPACE_COLORS[0].value);
    setDraftWorkspaceHidden(false);
    setDraftWorkspaceId(null);
    setPText("");
    setPDate("");
    setPTag("");
    setPType("standard");
    setPTime("");
  }

  // updates one or more of the draft workspace's meta fields (hidden /
  // icon / color). BUG-FIX PATTERN: if the workspace has already been
  // created (because a task was added before this change), the change
  // must ALSO be written directly onto that existing workspace record —
  // otherwise it only updates the draft, which nothing reads anymore
  // once the real workspace object already exists.
  function updateDraftWorkspaceMeta(updates) {
    if ("hidden" in updates) setDraftWorkspaceHidden(updates.hidden);
    if ("icon" in updates) setDraftWorkspaceIcon(updates.icon);
    if ("color" in updates) setDraftWorkspaceColor(updates.color);

    if (draftWorkspaceId !== null) {
      setWorkspaces((prev) =>
        prev.map((ws) => (ws.id === draftWorkspaceId ? { ...ws, ...updates } : ws))
      );
    }
  }

  function handleAddTaskToProject() {
    if (draftWorkspaceName.trim() === "") {
      alert("Please name your workspace first.");
      return;
    }
    const text = pText.trim();
    if (text === "") {
      alert("Please write something to do first.");
      return;
    }
    if (pDate && pDate < getTodayString()) {
      alert("The date can't be in the past.");
      return;
    }
    if (pType === "countdown" && (!pDate || !pTime)) {
      alert("Countdown tasks need both a date and a time.");
      return;
    }

    // create the workspace on the first task add only; every later
    // click in this session reuses the same draftWorkspaceId
    let workspaceId = draftWorkspaceId;
    if (workspaceId === null) {
      workspaceId = Date.now();
      setWorkspaces((prev) => [
        ...prev,
        {
          id: workspaceId,
          name: draftWorkspaceName.trim(),
          icon: draftWorkspaceIcon.trim(),
          color: draftWorkspaceColor,
          hidden: draftWorkspaceHidden,
        },
      ]);
      setDraftWorkspaceId(workspaceId);
    }

    addTodo({
      id: Date.now() + 1, // +1 so it can never collide with the workspace id above
      text,
      date: pDate,
      tag: normalizeTag(pTag),
      completed: false,
      type: pType,
      time: pType === "countdown" ? pTime : "",
      workspaceId,
    });

    setPText("");
    setPDate("");
    setPTag("");
    setPType("standard");
    setPTime("");
  }

  function handleFinishProject() {
    let workspaceId = draftWorkspaceId;

    if (workspaceId === null && draftWorkspaceName.trim() !== "") {
      workspaceId = Date.now();
      setWorkspaces((prev) => [
        ...prev,
        {
          id: workspaceId,
          name: draftWorkspaceName.trim(),
          icon: draftWorkspaceIcon.trim(),
          color: draftWorkspaceColor,
          hidden: draftWorkspaceHidden,
        },
      ]);
    }

    if (workspaceId !== null) {
      setViewMode("tasks");
      setActiveWorkspaceId(workspaceId);
    }

    closeProjectModal();
  }

  // =======================================================
  // EDIT MODAL OPERATIONS (shared: home list + settings modal)
  // =======================================================

  function openEditModal(todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDate(todo.date);
    setEditTag(todo.tag);
  }

  function closeEditModal() {
    setEditingId(null);
  }

  function applyEdit() {
    const newTextValue = editText.trim();
    if (newTextValue === "") {
      alert("Todo text can't be empty.");
      return;
    }
    if (editDate && editDate < getTodayString()) {
      alert("The date can't be in the past.");
      return;
    }

    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === editingId
          ? { ...todo, text: newTextValue, date: editDate, tag: normalizeTag(editTag) }
          : todo
      )
    );

    closeEditModal();
  }

  // =======================================================
  // DERIVED VALUES (recomputed every render — never stored in state)
  // =======================================================

  const visibleTodos = getVisibleTodos();
  const visibleWorkspaceTabs = workspaces.filter((ws) => !ws.hidden);
  const hiddenWorkspaces = workspaces.filter((ws) => ws.hidden);

  // ---- Dashboard stats ----
  const hiddenWorkspaceIds = getHiddenWorkspaceIds();
  const dashboardTasks = todos.filter((t) => !hiddenWorkspaceIds.includes(t.workspaceId));
  const totalTasksCount = dashboardTasks.length;
  const completedTasksCount = dashboardTasks.filter((t) => t.completed).length;
  const completionRate =
    totalTasksCount === 0 ? 0 : Math.round((completedTasksCount / totalTasksCount) * 100);
  const totalProjectsCount = visibleWorkspaceTabs.length;
  const activeCountdownsCount = dashboardTasks.filter((t) => {
    if (t.type !== "countdown" || !t.date || !t.time) return false;
    const target = combineDateAndTime(t.date, t.time);
    return target && target.getTime() > now.getTime();
  }).length;
  const todayString = getTodayString();
  const dueTodayCount = dashboardTasks.filter((t) => t.date === todayString && !t.completed).length;

  // what the small heading above the task list should read
  const viewTitle =
    viewMode === "done"
      ? "Done"
      : activeWorkspaceId === "all"
      ? "All tasks"
      : getWorkspace(activeWorkspaceId)?.name || "Tasks";

  // =======================================================
  // RENDER
  // =======================================================
  return (
    // FIX: this used to be a centered flex wrapper holding a separate,
    // narrower "surface" card — which read as a small floating card on
    // top of a mostly-empty black page. Now the whole page IS the
    // surface: one continuous background, no nested box, full width.
    <div className="min-h-screen bg-[var(--color-canvas)] text-[var(--color-ink)]">

      {/* ---------- header bar: hamburger sits in-flow, top-left,
          instead of a fixed floating button that could overlap
          content or sit awkwardly on small screens ---------- */}
      <div className="flex items-center gap-3 px-4 sm:px-8 py-4 border-b border-[var(--color-border)]">
        <button
          onClick={() => setShowSidebar(true)}
          aria-label="Open menu"
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-accent)] text-black text-xl font-bold hover:brightness-110 transition-all"
        >
          ☰
        </button>
        <h1 className="font-[var(--font-display)] text-xl sm:text-2xl font-semibold uppercase tracking-wide m-0">
          Taskly
        </h1>
      </div>

      {/* ---------- main content — fills the screen on mobile, caps
          at a comfortable reading width and centers on larger screens ---------- */}
      <div className="max-w-[700px] mx-auto px-4 sm:px-8 py-6">

        {/* ---------- search bar ---------- */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by text or #tag..."
          className="w-full px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors mb-3"
        />

        {/* ---------- action buttons ---------- */}
        <div className="flex gap-2.5 mb-4">
          <button
            onClick={openAddModal}
            className="flex-1 px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-[var(--color-accent)] text-black hover:brightness-110 active:translate-y-0.5 transition-all"
          >
            + New Task
          </button>
          <button
            onClick={openProjectModal}
            className="flex-1 px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-transparent border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
          >
            + Project
          </button>
        </div>

        {/* ---------- workspace tabs ---------- */}
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 mb-1 [scrollbar-width:none]">
          <button
            onClick={goToAllTasks}
            className={`shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border transition-colors ${
              viewMode === "tasks" && activeWorkspaceId === "all"
                ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-black"
                : "bg-transparent border-[var(--color-border)] text-[var(--color-ink-muted)]"
            }`}
          >
            All
          </button>

          {visibleWorkspaceTabs.map((ws) => {
            const isActive = viewMode === "tasks" && activeWorkspaceId === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => goToWorkspace(ws.id)}
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
            onClick={() => setShowHiddenPicker((prev) => !prev)}
            className="shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors ml-auto"
          >
            👻 Hidden
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            aria-label="Manage workspaces"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
          >
            ⚙
          </button>
        </div>

        {/* ---------- hidden-workspaces picker ---------- */}
        {showHiddenPicker && (
          <div className="flex flex-wrap gap-2 bg-[var(--color-canvas)] border border-[var(--color-border)] rounded-lg p-3 mb-4">
            {hiddenWorkspaces.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-muted)] m-0">No hidden workspaces.</p>
            ) : (
              hiddenWorkspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => goToWorkspace(ws.id)}
                  style={{ borderColor: ws.color, color: ws.color }}
                  className="px-3.5 py-1.5 text-[13px] font-semibold rounded-full border hover:bg-[var(--color-accent-light)] transition-colors"
                >
                  👻 {ws.icon} {ws.name}
                </button>
              ))
            )}
          </div>
        )}

        {/* ---------- current view heading ---------- */}
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)] mb-2 mt-1">
          {viewTitle}
        </p>

        {/* ---------- todo list ---------- */}
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
            visibleTodos.map((todo) => {
              const isCountdown = todo.type === "countdown" && todo.date && todo.time;
              const target = isCountdown ? combineDateAndTime(todo.date, todo.time) : null;
              // project color is used for the project's own name/badge only —
              // task cards, the complete circle, and the countdown border
              // always use the app's default orange accent
              const workspaceColor = todo.workspaceId ? getWorkspace(todo.workspaceId)?.color : null;
              const showWorkspaceBadge =
                (activeWorkspaceId === "all" || viewMode === "done") && todo.workspaceId;

              return (
                <div
                  key={todo.id}
                  className={`flex items-start gap-3 rounded-lg px-3.5 py-3 border ${
                    isCountdown
                      ? "bg-[var(--color-accent-light)] border-[var(--color-accent)] border-dashed"
                      : "bg-[var(--color-canvas)] border-[var(--color-border)] border-l-4 border-l-[var(--color-accent)]"
                  }`}
                >
                  <button
                    onClick={() => toggleComplete(todo.id)}
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
                      todo.completed ? "line-through text-[var(--color-ink-muted)]" : "text-[var(--color-ink)]"
                    }`}
                  >
                    {isCountdown && (
                      <span className="block text-[11px] uppercase tracking-wide text-[var(--color-accent)] mb-0.5">
                        ⏱ Countdown
                      </span>
                    )}

                    {todo.text}

                    {/* date + tag (+ workspace badge) share one flex-wrap
                        row below the text; date and tag sit side by side
                        when there's room, wrapping only when there isn't */}
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

                        {/* this badge names the project, so it's the one
                            place on a task card that still carries the
                            project's chosen color */}
                        {showWorkspaceBadge && (
                          <span
                            style={{ borderColor: workspaceColor, color: workspaceColor }}
                            className="inline-block text-xs px-2 py-0.5 rounded-full border"
                          >
                            {getWorkspace(todo.workspaceId)?.icon} {getWorkspace(todo.workspaceId)?.name}
                          </span>
                        )}
                      </span>
                    )}

                    {isCountdown && (
                      <span className="block text-xs font-semibold text-[var(--color-accent)] mt-1">
                        {formatRemaining(target)}
                      </span>
                    )}
                  </p>

                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => openEditModal(todo)}
                      className="px-3.5 py-2 text-[13px] font-semibold rounded-md bg-transparent border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="px-3.5 py-2 text-[13px] font-semibold rounded-md bg-transparent border border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ---------- ☰ sidebar ---------- */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 bg-black/60" onClick={closeSidebar}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed left-0 top-0 h-full w-72 max-w-[80vw] bg-[var(--color-surface)] border-r border-[var(--color-border)] p-5 flex flex-col gap-1 overflow-y-auto shadow-[0_0_30px_rgba(0,0,0,0.6)]"
          >
            <button
              onClick={openDashboard}
              className="text-left px-3 py-2.5 rounded-lg text-[15px] font-semibold text-[var(--color-ink)] hover:bg-[var(--color-accent-light)] transition-colors"
            >
              📊 Dashboard
            </button>

            <div className="h-px bg-[var(--color-border)] my-2" />

            <button
              onClick={() => setProjectsExpanded((prev) => !prev)}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] font-bold text-[var(--color-ink)] hover:bg-[var(--color-accent-light)] transition-colors"
            >
              <span>📁 Projects</span>
              <span className={`text-xs transition-transform ${projectsExpanded ? "rotate-90" : ""}`}>▶</span>
            </button>

            {projectsExpanded && (
              <div className="flex flex-col gap-1 pl-2 mb-1">
                {visibleWorkspaceTabs.length === 0 ? (
                  <p className="text-xs text-[var(--color-ink-muted)] px-3 py-1">No projects yet.</p>
                ) : (
                  visibleWorkspaceTabs.map((ws, index) => {
                    const pct = getWorkspaceCompletion(ws.id);
                    return (
                      <button
                        key={ws.id}
                        onClick={() => goToWorkspace(ws.id)}
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
              onClick={goToAllTasks}
              className={`text-left px-3 py-2.5 rounded-lg text-[15px] font-semibold hover:bg-[var(--color-accent-light)] transition-colors ${
                viewMode === "tasks" && activeWorkspaceId === "all"
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-ink)]"
              }`}
            >
              🗂 All tasks
            </button>

            <button
              onClick={goToDone}
              className={`text-left px-3 py-2.5 rounded-lg text-[15px] font-semibold hover:bg-[var(--color-accent-light)] transition-colors ${
                viewMode === "done" ? "text-[var(--color-accent)]" : "text-[var(--color-ink)]"
              }`}
            >
              ✅ Done
            </button>
          </div>
        </div>
      )}

      {/* ---------- Dashboard modal ---------- */}
      {showDashboardModal && (
        <div
          className="fixed inset-0 z-40 bg-black/60 flex justify-center items-center px-4"
          onClick={() => setShowDashboardModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-[var(--font-display)] text-xl text-[var(--color-ink)] m-0">Dashboard</h2>
              <button
                onClick={() => setShowDashboardModal(false)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] text-xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard label="Total tasks" value={totalTasksCount} />
              <StatCard label="Completed" value={completedTasksCount} />
              <StatCard label="Completion" value={`${completionRate}%`} />
              <StatCard label="Projects" value={totalProjectsCount} />
              <StatCard label="Countdowns" value={activeCountdownsCount} />
              <StatCard label="Due today" value={dueTodayCount} />
            </div>
          </div>
        </div>
      )}

      {/* ---------- "+ New Task" modal ---------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex justify-center items-center px-4">
          <div className="w-full max-w-[380px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <h2 className="font-[var(--font-display)] text-lg text-[var(--color-ink)] m-0">New task</h2>

            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="What needs to get done?"
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <LabeledDateTimeField
              label="Date"
              type="date"
              value={newDate}
              min={getTodayString()}
              onChange={(e) => setNewDate(e.target.value)}
              placeholder="Select date"
            />
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="#tag (optional)"
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
            />

            <div className="flex rounded-lg border-2 border-[var(--color-border)] overflow-hidden">
              <button
                onClick={() => setNewType("standard")}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  newType === "standard" ? "bg-[var(--color-accent)] text-black" : "bg-transparent text-[var(--color-ink-muted)]"
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setNewType("countdown")}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  newType === "countdown" ? "bg-[var(--color-accent)] text-black" : "bg-transparent text-[var(--color-ink-muted)]"
                }`}
              >
                Countdown
              </button>
            </div>

            {newType === "countdown" && (
              <LabeledDateTimeField
                label="Time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                placeholder="Select time"
              />
            )}

            <div className="flex gap-2.5 mt-1.5">
              <button
                onClick={handleCreateTask}
                className="flex-1 px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-[var(--color-accent)] text-black hover:brightness-110 transition-all"
              >
                Create
              </button>
              <button
                onClick={closeAddModal}
                className="flex-1 px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-transparent border border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- "+ Project" modal ---------- */}
      {showProjectModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex justify-center items-center px-4 py-8">
          <div className="w-full max-w-[560px] max-h-[90vh] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 flex flex-col gap-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <h2 className="font-[var(--font-display)] text-xl text-[var(--color-ink)] m-0">New workspace</h2>

            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide mb-2">
                Workspace details
              </p>

              <div className="flex items-center gap-2.5 mb-2">
                <input
                  type="text"
                  value={draftWorkspaceName}
                  onChange={(e) => setDraftWorkspaceName(e.target.value)}
                  placeholder="Name (e.g. Company)"
                  disabled={draftWorkspaceId !== null}
                  className="flex-1 min-w-0 px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors disabled:opacity-60"
                />
                <button
                  onClick={() => updateDraftWorkspaceMeta({ hidden: !draftWorkspaceHidden })}
                  aria-label="Toggle hidden workspace"
                  title="Hidden workspaces only appear under 👻 Hidden"
                  className={`shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center text-lg transition-colors ${
                    draftWorkspaceHidden ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-ink-muted)]"
                  }`}
                >
                  👻
                </button>
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] m-0 mb-3">
                {draftWorkspaceHidden ? "Hidden — only visible via the 👻 Hidden tab." : "Visible in the tab row and in All."}
              </p>

              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={draftWorkspaceIcon}
                  onChange={(e) => updateDraftWorkspaceMeta({ icon: e.target.value.slice(0, 6) })}
                  maxLength={6}
                  placeholder="💼"
                  className="w-20 px-3 py-2.5 text-[15px] text-center rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <ColorSwatchRow
                  selectedColor={draftWorkspaceColor}
                  onSelect={(color) => updateDraftWorkspaceMeta({ color })}
                />
              </div>
              <p className="text-xs text-[var(--color-ink-muted)] mt-2 m-0">
                Icon or emojy (up to 6 characters) and color tint this project's name everywhere it appears.
              </p>
            </div>

            <div className="h-px bg-[var(--color-border)]" />

            <div>
              <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide mb-2">
                Add a task to this workspace
              </p>

              <div className="flex flex-col gap-2.5">
                <input
                  type="text"
                  value={pText}
                  onChange={(e) => setPText(e.target.value)}
                  placeholder="What needs to get done?"
                  className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
                />
                <LabeledDateTimeField
                  label="Date"
                  type="date"
                  value={pDate}
                  min={getTodayString()}
                  onChange={(e) => setPDate(e.target.value)}
                  placeholder="Select date"
                />
                <input
                  type="text"
                  value={pTag}
                  onChange={(e) => setPTag(e.target.value)}
                  placeholder="#tag (optional)"
                  className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
                />

                {/* FIX: this segmented control had no label above it and
                    used small (text-sm, py-2) buttons, so it read as an
                    unlabeled, easy-to-miss row. It now has its own
                    heading and larger, bolder buttons. */}
                <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide mt-1 mb-0">
                  Task type
                </p>
                <div className="flex rounded-lg border-2 border-[var(--color-border)] overflow-hidden">
                  <button
                    onClick={() => setPType("standard")}
                    className={`flex-1 py-3 text-[15px] font-bold transition-colors ${
                      pType === "standard" ? "bg-[var(--color-accent)] text-black" : "bg-transparent text-[var(--color-ink-muted)]"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setPType("countdown")}
                    className={`flex-1 py-3 text-[15px] font-bold transition-colors ${
                      pType === "countdown" ? "bg-[var(--color-accent)] text-black" : "bg-transparent text-[var(--color-ink-muted)]"
                    }`}
                  >
                    Countdown
                  </button>
                </div>

                {pType === "countdown" && (
                  <LabeledDateTimeField
                    label="Time"
                    type="time"
                    value={pTime}
                    onChange={(e) => setPTime(e.target.value)}
                    placeholder="Select time"
                  />
                )}

                <button
                  onClick={handleAddTaskToProject}
                  className="px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-transparent border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
                >
                  + Add task
                </button>
              </div>
            </div>

            {draftWorkspaceId !== null && (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide m-0">
                  Added ({todos.filter((t) => t.workspaceId === draftWorkspaceId).length})
                </p>
                {todos
                  .filter((t) => t.workspaceId === draftWorkspaceId)
                  .map((t) => (
                    <p key={t.id} className="text-sm text-[var(--color-ink)] m-0">
                      • {t.text}
                    </p>
                  ))}
              </div>
            )}

            <button
              onClick={handleFinishProject}
              className="px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-[var(--color-accent)] text-black hover:brightness-110 transition-all mt-1"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ---------- edit modal (highest z-index: can open from the
          home list OR from inside the settings modal, and must always
          render on top of whatever else is open) ---------- */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-center px-4">
          <div className="w-full max-w-[360px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <h2 className="font-[var(--font-display)] text-lg text-[var(--color-ink)] m-0">Edit todo</h2>

            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <LabeledDateTimeField
              label="Date"
              type="date"
              value={editDate}
              min={getTodayString()}
              onChange={(e) => setEditDate(e.target.value)}
              placeholder="Select date"
            />
            <input
              type="text"
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              placeholder="#tag (optional)"
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
            />

            <div className="flex gap-2.5 mt-1.5">
              <button
                onClick={applyEdit}
                className="flex-1 px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-[var(--color-accent)] text-black hover:brightness-110 transition-all"
              >
                Apply
              </button>
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-transparent border border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- settings modal: manage all workspaces ---------- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-40 bg-black/60 flex justify-center items-center px-4">
          <div className="w-full max-w-[440px] max-h-[85vh] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-4 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between">
              <h2 className="font-[var(--font-display)] text-lg text-[var(--color-ink)] m-0">Manage workspaces</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {workspaces.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-muted)]">
                No workspaces yet — create one with the "+ Project" button.
              </p>
            ) : (
              workspaces.map((ws) => {
                const wsTasks = todos.filter((t) => t.workspaceId === ws.id);
                return (
                  <div key={ws.id} className="border border-[var(--color-border)] rounded-lg p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ws.icon}
                        onChange={(e) => setWorkspaceIcon(ws.id, e.target.value)}
                        maxLength={6}
                        className="w-14 px-2 py-1.5 text-sm text-center rounded-md bg-transparent border border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
                      />
                      <input
                        type="text"
                        value={ws.name}
                        onChange={(e) => renameWorkspace(ws.id, e.target.value)}
                        className="flex-1 min-w-0 px-2.5 py-1.5 text-sm font-semibold rounded-md bg-transparent border border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
                      />
                      <button
                        onClick={() => toggleWorkspaceHidden(ws.id)}
                        title="Toggle hidden"
                        className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                          ws.hidden ? "bg-[var(--color-accent)] border-[var(--color-accent)]" : "border-[var(--color-ink-muted)]"
                        }`}
                      >
                        👻
                      </button>
                      <button
                        onClick={() => deleteWorkspace(ws.id)}
                        className="shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-red-500 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>

                    <ColorSwatchRow selectedColor={ws.color} onSelect={(color) => setWorkspaceColor(ws.id, color)} />

                    {wsTasks.length === 0 ? (
                      <p className="text-xs text-[var(--color-ink-muted)] m-0">No tasks in this workspace.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {wsTasks.map((t) => (
                          <div key={t.id} className="flex items-center justify-between gap-2 text-sm text-[var(--color-ink)]">
                            <span className={`truncate ${t.completed ? "line-through text-[var(--color-ink-muted)]" : ""}`}>
                              {t.text}
                            </span>
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => openEditModal(t)}
                                className="px-2 py-1 text-xs font-semibold rounded border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTodo(t.id)}
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
          </div>
        </div>
      )}
    </div>
  );
}