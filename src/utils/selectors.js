import { combineDateAndTime, normalizeTag, getTodayString } from "./date";

// =========================================================
// SELECTORS
// Pure functions that derive a view of the data — they take
// state in and return a filtered/sorted copy, never mutating.
// =========================================================

export function getHiddenWorkspaceIds(workspaces) {
  return workspaces.filter((w) => w.hidden).map((w) => w.id);
}

function getSortTimestamp(todo) {
  if (!todo.date) return Infinity; // undated tasks sort last
  const target = combineDateAndTime(todo.date, todo.time);
  return target ? target.getTime() : Infinity;
}

export function sortByNearestDate(todoList) {
  return [...todoList].sort((a, b) => getSortTimestamp(a) - getSortTimestamp(b));
}

// filters by view mode + workspace, then search, then sorts
export function getVisibleTodos({ todos, workspaces, viewMode, activeWorkspaceId, searchQuery }) {
  let result = todos;
  const hiddenIds = getHiddenWorkspaceIds(workspaces);

  if (viewMode === "done") {
    // ignores the selected tab — shows every completed task
    result = result.filter((t) => t.completed && !hiddenIds.includes(t.workspaceId));
  } else if (activeWorkspaceId === "all") {
    result = result.filter((t) => !hiddenIds.includes(t.workspaceId));
  } else {
    result = result.filter((t) => t.workspaceId === activeWorkspaceId);
  }

  if (searchQuery !== "") {
    const query = normalizeTag(searchQuery).toLowerCase();
    result = result.filter((t) => {
      const textMatch = t.text.toLowerCase().includes(query);
      const tagMatch = (t.tag || "").toLowerCase().includes(query);
      return textMatch || tagMatch;
    });
  }

  return sortByNearestDate(result);
}

// completion % for one workspace (null if it has no tasks)
export function getWorkspaceCompletion(todos, workspaceId) {
  const wsTasks = todos.filter((t) => t.workspaceId === workspaceId);
  if (wsTasks.length === 0) return null;
  const done = wsTasks.filter((t) => t.completed).length;
  return Math.round((done / wsTasks.length) * 100);
}

// every number the Dashboard shows, computed in one pass
export function getDashboardStats(todos, workspaces, now) {
  const hiddenIds = getHiddenWorkspaceIds(workspaces);
  const visible = todos.filter((t) => !hiddenIds.includes(t.workspaceId));
  const total = visible.length;
  const completed = visible.filter((t) => t.completed).length;
  const today = getTodayString();

  const activeCountdowns = visible.filter((t) => {
    if (t.type !== "countdown" || !t.date || !t.time) return false;
    const target = combineDateAndTime(t.date, t.time);
    return target && target.getTime() > now.getTime();
  }).length;

  return {
    total,
    completed,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    projects: workspaces.filter((w) => !w.hidden).length,
    activeCountdowns,
    dueToday: visible.filter((t) => t.date === today && !t.completed).length,
  };
}