import { PrimaryButton, OutlineButton } from "../ui";

// =========================================================
// WelcomeModal — shown once, on first launch
//
// Doubles as the notification permission prompt: browsers only
// grant permission when it's requested from a real user gesture
// (a click), never automatically on page load.
// =========================================================

export function WelcomeModal({ open, onDismiss, onEnableNotifications, canAskNotifications }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex justify-center items-center px-4 py-8">
      <div className="w-full max-w-[400px] max-h-[90vh] overflow-y-auto overscroll-contain bg-[var(--color-surface)] border-2 border-[var(--color-accent)] rounded-2xl p-7 flex flex-col gap-4 shadow-[0_20px_50px_rgba(249,115,22,0.15)]">

        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent)] flex items-center justify-center text-3xl font-black text-black">
            T
          </div>

          <h2 className="font-[var(--font-display)] text-2xl font-semibold uppercase tracking-wide text-[var(--color-ink)] m-0">
            Welcome to Taskly
          </h2>

          <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed m-0">
            A progressive web app for organizing your life — built by{" "}
            <span className="text-[var(--color-accent)] font-semibold">Drod</span>.
          </p>
        </div>

        <div className="h-px bg-[var(--color-border)]" />

        <div className="flex flex-col gap-2.5">
          <Feature icon="📁" title="Projects">
            Group tasks into color-coded workspaces, and hide the private ones.
          </Feature>
          <Feature icon="⏱" title="Countdowns">
            Give a task a deadline and watch the time tick down live.
          </Feature>
          <Feature icon="📊" title="Dashboard">
            Track your progress across every project at a glance.
          </Feature>
          <Feature icon="🔒" title="Private by design">
            Everything is saved on this device. No account, no server, no tracking.
          </Feature>
        </div>

        <div className="flex flex-col gap-2 mt-1">
          {canAskNotifications && (
            <OutlineButton onClick={onEnableNotifications}>
              🔔 Enable reminders
            </OutlineButton>
          )}
          <PrimaryButton onClick={onDismiss}>Get started</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, children }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-lg shrink-0 w-6 text-center">{icon}</span>
      <p className="text-sm text-[var(--color-ink-muted)] leading-snug m-0">
        <span className="text-[var(--color-ink)] font-semibold">{title}</span> — {children}
      </p>
    </div>
  );
}