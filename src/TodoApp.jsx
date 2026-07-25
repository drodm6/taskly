import { useState, useEffect } from "react";

// =========================================================
// TodoApp
// =========================================================
export default function TodoApp() {
  // =======================================================
  // STATE
  // =======================================================

  // each todo is an object:
  // { id, text, date, tag, completed, type, time }
  // - completed: boolean, toggled by the small circle button
  // - type: "standard" | "countdown"
  // - time: only used when type === "countdown" (e.g. "14:30")
  const [todos, setTodos] = useState([]);

  // a ticking clock — updates every second so any visible
  // countdown badges recalculate their remaining time live,
  // without the user needing to refresh anything
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    // cleanup: stop the timer if TodoApp is ever removed from the page
    return () => clearInterval(intervalId);
  }, []);

  // controls whether the "create task" modal is visible
  const [showAddModal, setShowAddModal] = useState(false);

  // fields for the create-task modal
  const [newText, setNewText] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newType, setNewType] = useState("standard"); // "standard" | "countdown"
  const [newTime, setNewTime] = useState("");

  // holds the id of the todo currently open in the edit modal
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTag, setEditTag] = useState(""); // NEW — tag is now editable

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

  // today's date as "YYYY-MM-DD" — used as the `min` on date inputs so
  // the date picker itself won't offer past dates
  function getTodayString() {
    return new Date().toISOString().split("T")[0];
  }

  // combines a date string and an optional time string into one real
  // JS Date object we can do math on (needed for sorting + countdowns)
  function combineDateAndTime(dateStr, timeStr) {
    if (!dateStr) return null;
    return new Date(`${dateStr}T${timeStr || "00:00"}`);
  }

  // turns a millisecond difference into "1d 4h 12min left" style text
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

  // flips a single todo's completed flag, leaves every other todo untouched
  function toggleComplete(id) {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }

  // =======================================================
  // SORTING — nearest date first
  // =======================================================

  // returns a comparable timestamp for a todo: countdown tasks use
  // date+time combined, standard tasks use date only (midnight), and
  // todos with no date at all sort to the very end of the list
  function getSortTimestamp(todo) {
    if (!todo.date) return Infinity;
    const target = combineDateAndTime(todo.date, todo.time);
    return target ? target.getTime() : Infinity;
  }

  function sortByNearestDate(todoList) {
    return [...todoList].sort((a, b) => getSortTimestamp(a) - getSortTimestamp(b));
  }

  // =======================================================
  // SEARCH / FILTER
  // =======================================================

  function getFilteredTodos() {
    let result = todos;

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
  // ADD-TASK MODAL OPERATIONS
  // =======================================================

  function openAddModal() {
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
    // reset the form so it's blank the next time it opens
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
    });

    closeAddModal();
  }

  // =======================================================
  // EDIT MODAL OPERATIONS
  // =======================================================

  function openEditModal(todo) {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDate(todo.date);
    setEditTag(todo.tag); // NEW — pre-fill the tag too
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

  const visibleTodos = getFilteredTodos();

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <div className="min-h-screen bg-[var(--color-canvas)] flex justify-center items-start px-4 py-10 sm:py-16">
      <div className="w-full max-w-[520px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">

        {/* ---------- title ---------- */}
        <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-semibold text-center uppercase tracking-wide text-[var(--color-ink)] border-b-[3px] border-[var(--color-accent)] pb-3 mb-6">
          Taskly
        </h1>

        {/* ---------- home screen: search bar + "New Task" button ---------- */}
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by text or #tag..."
            className="flex-1 min-w-0 px-3 py-2.5 text-[15px] rounded-lg bg-transparent border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] outline-none focus:border-[var(--color-accent)] transition-colors"
          />
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto px-6 py-2.5 text-[15px] font-semibold rounded-lg bg-[var(--color-accent)] text-black hover:brightness-110 active:translate-y-0.5 transition-all"
          >
            + New Task
          </button>
        </div>

        {/* ---------- todo list ---------- */}
        <div className="flex flex-col gap-2.5">
          {visibleTodos.length === 0 ? (
            <p className="text-center text-[var(--color-ink-muted)] text-sm py-2.5">
              {searchQuery ? "No todos match your search." : 'No tasks yet — tap "+ New Task" to add one.'}
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
                  {/* ---- complete toggle circle ---- */}
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

                  {/* ---- text + date + tag + countdown badge ---- */}
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

                    {isCountdown && (
                      <span className="block text-xs font-semibold text-[var(--color-accent)] mt-1">
                        {formatRemaining(target)}
                      </span>
                    )}
                  </p>

                  {/* ---- edit / delete buttons ---- */}
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

      {/* ---------- create-task modal ---------- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center px-4">
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

            {/* ---- task type segmented control ---- */}
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

            {/* ---- time field, only shown for countdown tasks ---- */}
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

      {/* ---------- edit modal ---------- */}
      {editingId !== null && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center px-4">
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
    </div>
  );
}