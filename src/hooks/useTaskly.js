import { useState, useEffect } from "react";
import { load, save } from "../utils/storage";

// =========================================================
// useTaskly — the app's data layer
//
// todo:      { id, text, date, tag, completed, type, time, workspaceId }
// workspace: { id, name, icon, color, hidden }
//
// Linked by workspaceId only — a task points at its project
// rather than living inside it, so task operations never need
// to know projects exist.
//
// Both arrays persist to localStorage: on-device only, no server.
// =========================================================

export function useTaskly() {
  // lazy initializers — the function form runs only on the first
  // render, so localStorage isn't re-read on every state change
  const [todos, setTodos] = useState(() => load("todos", []));
  const [workspaces, setWorkspaces] = useState(() => load("workspaces", []));

  // save whenever either changes; separate effects so editing a task
  // doesn't also rewrite the untouched workspaces entry
  useEffect(() => {
    save("todos", todos);
  }, [todos]);

  useEffect(() => {
    save("workspaces", workspaces);
  }, [workspaces]);

  // ---- todos ----

  function addTodo(todo) {
    setTodos((prev) => [...prev, { id: Date.now(), completed: false, ...todo }]);
  }

  function deleteTodo(id) {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  function toggleComplete(id) {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }

  // applies a partial patch to one todo, leaving other fields intact
  function updateTodo(id, updates) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  // ---- workspaces ----

  // returns the new id so callers can immediately attach tasks to it
  function createWorkspace({ name, icon, color, hidden }) {
    const id = Date.now();
    setWorkspaces((prev) => [...prev, { id, name, icon, color, hidden }]);
    return id;
  }

  function updateWorkspace(id, updates) {
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }

  // deleting a workspace deletes its tasks too; onDeleted lets the
  // caller reset its selected tab if that workspace was being viewed
  function deleteWorkspace(id, onDeleted) {
    const ok = window.confirm(
      "Delete this workspace? All tasks inside it will be deleted too."
    );
    if (!ok) return;

    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    setTodos((prev) => prev.filter((t) => t.workspaceId !== id));
    if (onDeleted) onDeleted();
  }

  function getWorkspace(id) {
    return workspaces.find((w) => w.id === id) || null;
  }

  return {
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
  };
}