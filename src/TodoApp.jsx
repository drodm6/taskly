import { useState, useEffect } from "react";

// =========================================================
// TodoApp
// =========================================================
export default function TodoApp() {
  // =======================================================
  // STATE
  // =======================================================

  // each todo is an object:
  // { id, text, date, tag, completed, type, time, workspaceId }
  // - workspaceId: null = a general task (not in any project),
  //   otherwise it matches the id of a workspace below
  const [todos, setTodos] = useState([]);

  // each workspace ("project") is an object: { id, name, hidden }
  const [workspaces, setWorkspaces] = useState([]);

  // which view the home screen is currently showing:
  // "all" = every task from every non-hidden workspace + general tasks
  // a workspace id = only that workspace's tasks
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("all");

  // controls the small dropdown that lists hidden workspaces,
  // opened via the "👻 Hidden" tab
  const [showHiddenPicker, setShowHiddenPicker] = useState(false);

  // controls the "manage workspaces" modal opened via the ⚙ icon
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // a ticking clock — updates every second so any visible
  // countdown badges recalculate their remaining time live
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
  const [draftWorkspaceHidden, setDraftWorkspaceHidden] = useState(false);
  // becomes a real id the moment the workspace is first actually created
  // (on the first "Add" click, or on "Done" if it has a name)
  const [draftWorkspaceId, setDraftWorkspaceId] = useState(null);
  // task fields for adding tasks *inside* the project modal — kept
  // separate from newText/newDate/etc above so the two modals never
  // interfere with each other's form state
  const [pText, setPText] = useState("");
  const [pDate, setPDate] = useState("");
  const [pTag, setPTag] = useState("");
  const [pType, setPType] = useState("standard");
  const [pTime, setPTime] = useState("");

  // ---- edit modal (shared by both the home list and the settings modal) ----
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTag, setEditTag] = useState("");

  // current text typed into the search bar
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

  // looks up a workspace's name from its id, for display purposes
  function getWorkspaceName(workspaceId) {
    const ws = workspaces.find((w) => w.id === workspaceId);
    return ws ? ws.name : null;
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
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, name: newName } : ws))
    );
  }

  function toggleWorkspaceHidden(id) {
    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, hidden: !ws.hidden } : ws))
    );
  }

  function deleteWorkspace(id) {
    const confirmed = window.confirm(
      "Delete this workspace? All tasks inside it will be deleted too."
    );
    if (!confirmed) return;

    setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
    setTodos((prev) => prev.filter((todo) => todo.workspaceId !== id));

    // if you were viewing the workspace you just deleted, fall back to "All"
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
  // SEARCH / FILTER / ACTIVE WORKSPACE VIEW
  // =======================================================

  // this is the single function that decides what shows on the home
  // screen: it applies the workspace filter first, then the search
  // filter on top, then sorts — in that order
  function getVisibleTodos() {
    let result = todos;

    if (activeWorkspaceId === "all") {
      // "All" excludes tasks that live inside a hidden workspace —
      // general tasks (workspaceId === null) and tasks in any
      // visible workspace both still show up here
      const hiddenWorkspaceIds = workspaces.filter((w) => w.hidden).map((w) => w.id);
      result = result.filter((todo) => !hiddenWorkspaceIds.includes(todo.workspaceId));
    } else {
      // a specific workspace tab (or a hidden workspace picked from
      // the 👻 Hidden list) — only show tasks that belong to it
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
  // "+ NEW TASK" MODAL (home-screen quick add)
  // =======================================================

  function openAddModal() {
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
      // if you're currently viewing a specific workspace, the new
      // task automatically joins it; if you're on "All", it's a
      // general task with no workspace
      workspaceId: activeWorkspaceId === "all" ? null : activeWorkspaceId,
    });

    closeAddModal();
  }

  // =======================================================
  // "+ PROJECT" MODAL (create a workspace + tasks inside it)
  // =======================================================

  function openProjectModal() {
    setShowProjectModal(true);
  }

  // toggles the "hidden / private" flag for the workspace being created.
  //
  // BUG FIX: previously this only updated `draftWorkspaceHidden`, which
  // is fine BEFORE any task has been added (that draft value gets read
  // once, when the workspace is first created). But once a task has
  // already been added, the workspace object already exists in the
  // `workspaces` array with its `hidden` value locked in — toggling
  // the draft afterward silently did nothing to that existing record.
  // Now we also patch the real workspace record directly whenever one
  // already exists, so the ghost icon works no matter when it's clicked.
  function toggleDraftWorkspaceHidden() {
    const nextHidden = !draftWorkspaceHidden;
    setDraftWorkspaceHidden(nextHidden);

    if (draftWorkspaceId !== null) {
      setWorkspaces((prevWorkspaces) =>
        prevWorkspaces.map((ws) =>
          ws.id === draftWorkspaceId ? { ...ws, hidden: nextHidden } : ws
        )
      );
    }
  }

  function closeProjectModal() {
    setShowProjectModal(false);
    setDraftWorkspaceName("");
    setDraftWorkspaceHidden(false);
    setDraftWorkspaceId(null);
    setPText("");
    setPDate("");
    setPTag("");
    setPType("standard");
    setPTime("");
  }

  // adds one task into the workspace being created — creates the
  // workspace itself on the very first call, reuses it after that
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

    // create the workspace now, but only the first time this modal
    // session adds a task — every later click reuses draftWorkspaceId
    let workspaceId = draftWorkspaceId;
    if (workspaceId === null) {
      workspaceId = Date.now();
      setWorkspaces((prev) => [
        ...prev,
        { id: workspaceId, name: draftWorkspaceName.trim(), hidden: draftWorkspaceHidden },
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

    // clear only the task fields — name/hidden stay, and the modal
    // stays open so more tasks can be added
    setPText("");
    setPDate("");
    setPTag("");
    setPType("standard");
    setPTime("");
  }

  // "Done" — finalizes the workspace (creating it even if no tasks
  // were added, as long as it has a name) and switches the home
  // screen straight to that workspace's view
  function handleFinishProject() {
    let workspaceId = draftWorkspaceId;

    if (workspaceId === null && draftWorkspaceName.trim() !== "") {
      workspaceId = Date.now();
      setWorkspaces((prev) => [
        ...prev,
        { id: workspaceId, name: draftWorkspaceName.trim(), hidden: draftWorkspaceHidden },
      ]);
    }

    if (workspaceId !== null) {
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

  const visibleTodos = getVisibleTodos();
  const visibleWorkspaceTabs = workspaces.filter((ws) => !ws.hidden);
  const hiddenWorkspaces = workspaces.filter((ws) => ws.hidden);

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex justify-center items-start px-4 py-10 sm:py-16">
      <div className="w-full max-w-[560px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">

        {/* ---------- title ---------- */}
        <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-semibold text-center uppercase tracking-wide text-[var(--color-ink)] border-b-[3px] border-[var(--color-accent)] pb-3 mb-6">
          Taskly
        </h1>

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
            onClick={() => { setActiveWorkspaceId("all"); setShowHiddenPicker(false); }}
            className={`shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border transition-colors ${
              activeWorkspaceId === "all"
                ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-black"
                : "bg-transparent border-[var(--color-border)] text-[var(--color-ink-muted)]"
            }`}
          >
            All
          </button>

          {visibleWorkspaceTabs.map((ws) => (
            <button
              key={ws.id}
              onClick={() => { setActiveWorkspaceId(ws.id); setShowHiddenPicker(false); }}
              className={`shrink-0 px-3.5 py-1.5 text-[13px] font-semibold rounded-full border transition-colors ${
                activeWorkspaceId === ws.id
                  ? "bg-[var(--color-accent)] border-[var(--color-accent)] text-black"
                  : "bg-transparent border-[var(--color-border)] text-[var(--color-ink-muted)]"
              }`}
            >
              {ws.name}
            </button>
          ))}

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
                  onClick={() => { setActiveWorkspaceId(ws.id); setShowHiddenPicker(false); }}
                  className="px-3.5 py-1.5 text-[13px] font-semibold rounded-full border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
                >
                  👻 {ws.name}
                </button>
              ))
            )}
          </div>
        )}

        {/* ---------- todo list ---------- */}
        <div className="flex flex-col gap-2.5 mt-3">
          {visibleTodos.length === 0 ? (
            <p className="text-center text-[var(--color-ink-muted)] text-sm py-2.5">
              {searchQuery ? "No todos match your search." : 'No tasks here yet.'}
            </p>
          ) : (
            visibleTodos.map((todo) => {
              const isCountdown = todo.type === "countdown" && todo.date && todo.time;
              const target = isCountdown ? combineDateAndTime(todo.date, todo.time) : null;

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

                    {todo.date && (
                      <span className="inline text-xs text-[var(--color-ink-muted)] ml-2">
                        {formatDate(todo.date)}
                        {todo.time ? ` · ${todo.time}` : ""}
                      </span>
                    )}

                    {todo.tag && (
                      <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full ml-2 bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                        #{todo.tag}
                      </span>
                    )}

                    {/* only shown in "All", so you can tell which project a task belongs to */}
                    {activeWorkspaceId === "all" && todo.workspaceId && (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full ml-2 border border-[var(--color-border)] text-[var(--color-ink-muted)]">
                        {getWorkspaceName(todo.workspaceId)}
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
                      className="px-3.5 py-2 text-[12px] font-semibold rounded-md bg-transparent border border-[var(--color-ink-muted)] text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
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
            <input
              type="date"
              value={newDate}
              min={getTodayString()}
              onChange={(e) => setNewDate(e.target.value)}
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
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
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
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
        <div className="fixed inset-0 z-40 bg-black/60 flex justify-center items-center px-4">
          <div className="w-full max-w-[420px] max-h-[85vh] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6 flex flex-col gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.6)]">
            <h2 className="font-[var(--font-display)] text-lg text-[var(--color-ink)] m-0">New workspace</h2>

            <div className="flex items-center gap-2.5">
              <input
                type="text"
                value={draftWorkspaceName}
                onChange={(e) => setDraftWorkspaceName(e.target.value)}
                placeholder="Workspace name (e.g. React)"
                disabled={draftWorkspaceId !== null}
                className="flex-1 min-w-0 px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors disabled:opacity-60"
              />
              <button
                onClick={toggleDraftWorkspaceHidden}
                aria-label="Toggle hidden workspace"
                title="Hidden workspaces only appear under 👻 Hidden"
                className={`shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-colors ${
                  draftWorkspaceHidden
                    ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                    : "border-[var(--color-ink-muted)]"
                }`}
              >
                👻
              </button>
            </div>
            <p className="text-xs text-[var(--color-ink-muted)] -mt-2 m-0">
              {draftWorkspaceHidden ? "Hidden — only visible via the 👻 Hidden tab." : "Visible in the tab row and in All."}
            </p>

            <div className="h-px bg-[var(--color-border)] my-1" />

            <p className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide m-0">
              Add tasks to this workspace
            </p>

            <input
              type="text"
              value={pText}
              onChange={(e) => setPText(e.target.value)}
              placeholder="What needs to get done?"
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <input
              type="date"
              value={pDate}
              min={getTodayString()}
              onChange={(e) => setPDate(e.target.value)}
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
            />
            <input
              type="text"
              value={pTag}
              onChange={(e) => setPTag(e.target.value)}
              placeholder="#tag (optional)"
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
            />

            <div className="flex rounded-lg border-2 border-[var(--color-border)] overflow-hidden">
              <button
                onClick={() => setPType("standard")}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  pType === "standard" ? "bg-[var(--color-accent)] text-black" : "bg-transparent text-[var(--color-ink-muted)]"
                }`}
              >
                Standard
              </button>
              <button
                onClick={() => setPType("countdown")}
                className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                  pType === "countdown" ? "bg-[var(--color-accent)] text-black" : "bg-transparent text-[var(--color-ink-muted)]"
                }`}
              >
                Countdown
              </button>
            </div>

            {pType === "countdown" && (
              <input
                type="time"
                value={pTime}
                onChange={(e) => setPTime(e.target.value)}
                className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            )}

            <button
              onClick={handleAddTaskToProject}
              className="px-4 py-2.5 text-[15px] font-semibold rounded-lg bg-transparent border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
            >
              + Add task
            </button>

            {draftWorkspaceId !== null && (
              <div className="flex flex-col gap-1.5 mt-1">
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

      {/* ---------- edit modal ----------
          BUG FIX: this needs a HIGHER z-index than every other modal.
          It can be opened either from the home screen list, or from
          inside the settings modal (which is already open at that
          point). Without an explicit z-index, whichever modal appears
          later in the JSX simply painted on top by default — so the
          edit modal was technically open, just invisible underneath
          the settings modal. z-50 guarantees it always renders on top,
          and the settings modal stays open behind it, exactly where
          you left it, once you close or apply the edit. */}
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
            <input
              type="date"
              value={editDate}
              min={getTodayString()}
              onChange={(e) => setEditDate(e.target.value)}
              className="px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)] transition-colors"
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
                  <div
                    key={ws.id}
                    className="border border-[var(--color-border)] rounded-lg p-3.5 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center gap-2">
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
                          ws.hidden
                            ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                            : "border-[var(--color-ink-muted)]"
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

                    {wsTasks.length === 0 ? (
                      <p className="text-xs text-[var(--color-ink-muted)] m-0">No tasks in this workspace.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {wsTasks.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-2 text-sm text-[var(--color-ink)]"
                          >
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